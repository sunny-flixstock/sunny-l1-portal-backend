const axios = require('axios');
const crypto = require('crypto');
const mime = require('mime-types');
const ImageDescriptionModel = require('../models/ImageDescription.model');
const ExampleImageModel = require('../models/ExampleImage.model');
const { IMAGE_DESCRIPTION_STATUSES } = require('../models/ImageDescription.model');
const { getSystemInstructionById } = require('./systemInstruction.service');
const { getFrameworkVocabById } = require('./frameworkVocab.service');
const { getCategoryRegistryById } = require('./categoryRegistry.service');
const { generate } = require('./llm/llm.service');
const { completeImageObject } = require('../utils/completeImageObject');
const { ConvertImageToJpg } = require('../utils/lambda');

const { assigned, inProgress, completed, rejected } = IMAGE_DESCRIPTION_STATUSES;

const IMAGE_FETCH_TIMEOUT_MS = 20000;
const SUPPORTED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif']);
const DEFAULT_MAX_ITEMS_PER_RUN = 2500;
const DEFAULT_CONCURRENCY = 10;

const resolveMime = (url) => mime.lookup(url.split('?')[0]) || null;

const formatJsonBlock = (label, value) => {
    if (value == null) {
        return '';
    }

    const serialized =
        typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    if (!serialized.trim()) {
        return '';
    }

    return `${label}:\n${serialized}`;
};

const stripMarkdownJsonFence = (raw) => {
    let text = String(raw ?? '').trim();
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenced) {
        return fenced[1].trim();
    }
    return text;
};

const extractJsonText = (raw) => {
    if (raw != null && typeof raw === 'object') {
        return JSON.stringify(raw);
    }

    let text = stripMarkdownJsonFence(raw);
    if (!text) {
        return '';
    }

    if (text.startsWith('{') || text.startsWith('[')) {
        return text;
    }

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
        return text.slice(start, end + 1);
    }

    return text;
};

const stringifyModelJsonResponse = (raw) => {
    const jsonText = extractJsonText(raw);
    if (!jsonText.trim()) {
        throw new Error('Model returned an empty description');
    }

    try {
        return JSON.stringify(JSON.parse(jsonText));
    } catch (err) {
        throw new Error(`Model response is not valid JSON: ${err.message}`);
    }
};

const buildImageDescriptionUserContent = ({ frameworkVocab, categoryRegistry }) => {
    const blocks = [
        formatJsonBlock('framework_vocab', frameworkVocab?.vocab),
        formatJsonBlock('category_registry', categoryRegistry?.registry),
    ].filter(Boolean);

    if (!blocks.length) {
        throw new Error('Framework vocab and category registry have no content');
    }

    return blocks.join('\n\n');
};

const pickAssignedImageDescription = async () =>
    ImageDescriptionModel.findOneAndUpdate(
        { status: assigned },
        { $set: { status: inProgress, rejectionReason: '' } },
        { sort: { updatedAt: 1 }, new: true }
    ).lean();

const fetchExampleImageBuffer = async (imageId) => {
    const exampleImage = await ExampleImageModel.findById(imageId).select({ image: 1 }).lean();
    if (!exampleImage) {
        throw new Error(`Example image not found: ${imageId}`);
    }

    const image = completeImageObject(
        exampleImage.image ? { ...exampleImage.image } : null
    );
    const imageUrl = image?.imagePath?.url;
    if (!imageUrl) {
        throw new Error(`Example image has no imagePath.url: ${imageId}`);
    }

    const mimeType = resolveMime(imageUrl);
    if (!mimeType || !SUPPORTED_IMAGE_MIMES.has(mimeType)) {
        throw new Error(`Unsupported image MIME type: ${mimeType || 'unknown'}`);
    }

    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: IMAGE_FETCH_TIMEOUT_MS,
    });

    return {
        buffer: Buffer.from(response.data),
        mimeType,
        imagePath: image.imagePath,
    };
};

const markImageDescriptionRejected = async (id, rejectionReason) => {
    await ImageDescriptionModel.updateOne(
        { _id: id, status: inProgress },
        {
            $set: {
                status: rejected,
                rejectionReason: String(rejectionReason ?? '').slice(0, 2000),
            },
        }
    );
};

const markImageDescriptionCompleted = async (id, description) => {
    await ImageDescriptionModel.updateOne(
        { _id: id, status: inProgress },
        {
            $set: {
                description: String(description ?? ''),
                status: completed,
                rejectionReason: '',
            },
        }
    );
};

const processImageDescriptionJob = async (job) => {
    const tag = `[imageDescription ${job._id}]`;

    if (!job.frameworkVocabId) {
        throw new Error('Image description is missing frameworkVocabId');
    }
    if (!job.categoryRegistryId) {
        throw new Error('Image description is missing categoryRegistryId');
    }

    const [instruction, fetchedImage, frameworkVocab, categoryRegistry] = await Promise.all([
        getSystemInstructionById(job.descriptionInstruction, {
            includeContent: true,
        }),
        fetchExampleImageBuffer(job.imageId),
        getFrameworkVocabById(job.frameworkVocabId),
        getCategoryRegistryById(job.categoryRegistryId),
    ]);
    let image = fetchedImage;

    if (!instruction.systemPrompt?.trim()) {
        throw new Error(`System instruction has no content: ${job.descriptionInstruction}`);
    }

    const userContent = buildImageDescriptionUserContent({
        frameworkVocab,
        categoryRegistry,
    });

    if (job.provider === 'google' && image.mimeType === 'image/avif') {
        const shortId = crypto.randomBytes(6).toString('hex');
        const outputKey = image.imagePath.key.replace(/\.[^.]+$/, `-${shortId}.jpg`);
        await ConvertImageToJpg({
            inputBucket: image.imagePath.host,
            inputKey: image.imagePath.key,
            outputBucket: image.imagePath.host,
            outputKey,
        });
        const jpgImage = completeImageObject({ imagePath: { ...image.imagePath, key: outputKey } });
        const jpgResponse = await axios.get(jpgImage.imagePath.url, {
            responseType: 'arraybuffer',
            timeout: IMAGE_FETCH_TIMEOUT_MS,
        });
        image = { buffer: Buffer.from(jpgResponse.data), mimeType: 'image/jpeg' };
    }

    const t0 = Date.now();
    const description = await generate({
        provider: job.provider,
        model: job.model,
        systemPrompt: instruction.systemPrompt,
        userContent,
        images: [image],
        responseFormat: 'text',
    });
    console.LogColor(
        console.color.FgCyan,
        `${tag} ${job.provider}/${job.model} returned in ${Date.now() - t0}ms`
    );

    const text = stringifyModelJsonResponse(description);

    await markImageDescriptionCompleted(job._id, text);
    return { ok: true, id: job._id, descLen: text.length };
};

const pickAssignedImageDescriptions = async (count) => {
    const picks = await Promise.all(
        Array.from({ length: count }, () => pickAssignedImageDescription())
    );
    return picks.filter(Boolean);
};

const processClaimedImageDescription = async (job) => {
    const tag = `[imageDescription ${job._id}]`;

    try {
        return await processImageDescriptionJob(job);
    } catch (err) {
        console.LogColor(console.color.FgRed, `${tag} failed: ${err.message}`);
        await markImageDescriptionRejected(job._id, err.message);
        return { ok: false, id: job._id, error: err.message };
    }
};

const processNextImageDescription = async () => {
    const [job] = await pickAssignedImageDescriptions(1);
    if (!job) {
        return null;
    }

    return processClaimedImageDescription(job);
};

const runImageDescriptionWorker = async ({
    maxItems = DEFAULT_MAX_ITEMS_PER_RUN,
    concurrency = DEFAULT_CONCURRENCY,
} = {}) => {
    let processed = 0;
    let completedCount = 0;
    let failed = 0;

    while (processed < maxItems) {
        const batchSize = Math.min(concurrency, maxItems - processed);
        const jobs = await pickAssignedImageDescriptions(batchSize);
        if (!jobs.length) {
            break;
        }

        const results = await Promise.all(jobs.map((job) => processClaimedImageDescription(job)));

        for (const result of results) {
            processed += 1;
            if (result.ok) {
                completedCount += 1;
            } else {
                failed += 1;
            }
        }
    }

    return { processed, completed: completedCount, failed };
};

module.exports = {
    pickAssignedImageDescription,
    pickAssignedImageDescriptions,
    processNextImageDescription,
    runImageDescriptionWorker,
};
