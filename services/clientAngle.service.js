const axios = require('axios');
const mime = require('mime-types');
const mongoose = require('mongoose');
const ClientAngleModel = require('../models/ClientAngle.model');
const BaseAngleModel = require('../models/BaseAngle.model');
const ClientModel = require('../models/Client.model');
const { ANGLE_STATUSES } = require('../models/ClientAngle.model');
const { INSTRUCTION_TYPES } = require('../models/SystemInstruction.model');
const { uploadAngleDefinition, readPromptContent } = require('../models/PromptRegistry.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');
const { buildClientAngleSeriesKey } = require('../utils/angleKeys');
const { buildSampleImages, enrichClientAngle } = require('../utils/angleImages');
const { WrapInTransaction } = require('../startup/db');
const { getSystemInstructionById } = require('./systemInstruction.service');
const { generate } = require('./llm/llm.service');
const {
    buildClientAngleSystemPrompt,
    buildClientAngleUserPrompt,
} = require('./clientAnglePromptBuilder');
const {
    getS3PreSignedpath,
} = require('./amazonS3Service');
const { buildClientAngleImageStorageKey } = require('../utils/angleImageStorage');
const { completeImageObject } = require('../utils/completeImageObject');
const { S3_BUCKET } = require('../config');

const IMAGE_FETCH_TIMEOUT_MS = 20000;
const SUPPORTED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const CLIENT_ANGLE_INSTRUCTION_TYPE = 'client_angle_definition';

const resolveMime = (url) => mime.lookup(url.split('?')[0]) || null;

const assertClientExists = async (client) => {
    const exists = await ClientModel.exists({ code: client });
    if (!exists) {
        throw new Api400Error(`Client not found: ${client}`);
    }
};

const archiveActiveInSeries = async (seriesKey, session) => {
    await ClientAngleModel.updateMany(
        { seriesKey, status: 'active' },
        { $set: { status: 'archived' } },
        { session }
    );
};

const fetchImageBufferFromPath = async (imageInput) => {
    const image = completeImageObject(
        imageInput?.imagePath ? { ...imageInput } : null
    );
    const imageUrl = image?.imagePath?.url;
    if (!imageUrl) {
        throw new Api400Error('Reference image has no imagePath.url');
    }

    const mimeType = resolveMime(imageUrl);
    if (!mimeType || !SUPPORTED_IMAGE_MIMES.has(mimeType)) {
        throw new Api400Error(`Unsupported image MIME type: ${mimeType || 'unknown'}`);
    }

    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: IMAGE_FETCH_TIMEOUT_MS,
    });

    return {
        buffer: Buffer.from(response.data),
        mimeType,
    };
};

const listClientAngles = async ({ client, baseAngleSeriesKey, q, status, pageNum, pageSize }) => {
    const filter = {};

    const resolvedStatus = status?.trim() || 'active';
    if (resolvedStatus !== 'all') {
        if (!ANGLE_STATUSES.includes(resolvedStatus)) {
            throw new Api400Error(`Invalid status: ${resolvedStatus}`);
        }
        filter.status = resolvedStatus;
    }

    if (client) {
        filter.client = client.trim();
    }

    if (baseAngleSeriesKey) {
        filter.baseAngleSeriesKey = baseAngleSeriesKey.trim();
    }

    if (q) {
        const pattern = escapeRegex(q);
        filter.$or = [
            { name: { $regex: pattern, $options: 'i' } },
            { seriesKey: { $regex: pattern, $options: 'i' } },
        ];
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [rows, total] = await Promise.all([
        ClientAngleModel.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        ClientAngleModel.countDocuments(filter),
    ]);

    return {
        data: rows.map(enrichClientAngle),
        pagination: {
            total,
            pageNum: resolvedPageNum,
            pageSize: limit,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

const listAllClientAngles = async ({ client, baseAngleSeriesKey, q, status }) => {
    const filter = {};

    const resolvedStatus = status?.trim() || 'active';
    if (resolvedStatus !== 'all') {
        if (!ANGLE_STATUSES.includes(resolvedStatus)) {
            throw new Api400Error(`Invalid status: ${resolvedStatus}`);
        }
        filter.status = resolvedStatus;
    }

    if (client) {
        filter.client = client.trim();
    }

    if (baseAngleSeriesKey) {
        filter.baseAngleSeriesKey = baseAngleSeriesKey.trim();
    }

    if (q) {
        const pattern = escapeRegex(q);
        filter.$or = [
            { name: { $regex: pattern, $options: 'i' } },
            { seriesKey: { $regex: pattern, $options: 'i' } },
        ];
    }

    const rows = await ClientAngleModel.find(filter).sort({ updatedAt: -1 }).lean();
    return { data: rows.map(enrichClientAngle), total: rows.length };
};

const listClientAngleVersions = async (seriesKey) => {
    const normalized = seriesKey?.trim();
    if (!normalized) {
        throw new Api400Error('seriesKey is required');
    }

    const rows = await ClientAngleModel.find({ seriesKey: normalized })
        .sort({ version: -1 })
        .lean();

    return rows.map(enrichClientAngle);
};

const getClientAngleById = async (id, { includeContent = false } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid client angle id');
    }

    const doc = await ClientAngleModel.findById(id).lean();
    if (!doc) {
        throw new Api400Error(`Client angle not found: ${id}`);
    }

    const enriched = enrichClientAngle(doc);
    if (!includeContent) {
        return enriched;
    }

    const definitionMarkdown = await readPromptContent(doc.definitionStorage);
    return { ...enriched, definitionMarkdown };
};

const presignClientAngleUploads = async ({ client, files }) => {
    await assertClientExists(client);

    const presigned = await Promise.all(
        files.map(async (file) => {
            const { fileName, contentType } = file;
            const { key, storageFileName, originalFileName } = buildClientAngleImageStorageKey(
                client,
                fileName,
                contentType
            );
            const { url } = await getS3PreSignedpath(key, contentType, S3_BUCKET);
            return {
                fileName,
                contentType,
                key,
                url,
                storageFileName,
                originalFileName,
                bucket: S3_BUCKET,
            };
        })
    );

    return presigned;
};

const generateClientAngle = async (body) => {
    const client = body.client?.trim();
    const baseAngleId = body.baseAngleId;
    const systemInstructionId = body.systemInstructionId;
    const provider = body.provider?.trim();
    const model = body.model?.trim();

    if (!client) {
        throw new Api400Error('client is required');
    }
    if (!mongoose.Types.ObjectId.isValid(baseAngleId)) {
        throw new Api400Error('Invalid baseAngleId');
    }
    if (!mongoose.Types.ObjectId.isValid(systemInstructionId)) {
        throw new Api400Error('Invalid systemInstructionId');
    }
    if (!provider) {
        throw new Api400Error('provider is required');
    }
    if (!model) {
        throw new Api400Error('model is required');
    }

    const referenceImages = buildSampleImages(body.referenceImages ?? []);
    if (!referenceImages.length) {
        throw new Api400Error('At least one reference image is required');
    }

    await assertClientExists(client);

    const baseAngle = await BaseAngleModel.findById(baseAngleId).lean();
    if (!baseAngle) {
        throw new Api400Error(`Base angle not found: ${baseAngleId}`);
    }
    if (baseAngle.status !== 'active') {
        throw new Api400Error('Base angle must be active');
    }

    const instruction = await getSystemInstructionById(systemInstructionId, {
        includeContent: true,
    });
    if (instruction.status !== 'active') {
        throw new Api400Error('System instruction must be active');
    }
    if (instruction.instructionType !== CLIENT_ANGLE_INSTRUCTION_TYPE) {
        throw new Api400Error(
            `System instruction must be of type ${CLIENT_ANGLE_INSTRUCTION_TYPE}`
        );
    }
    if (!instruction.systemPrompt?.trim()) {
        throw new Api400Error('System instruction has no content');
    }

    const baseDefinitionMarkdown = await readPromptContent(baseAngle.definitionStorage);

    const imageBuffers = await Promise.all(
        referenceImages.map((image) => fetchImageBufferFromPath(image))
    );

    const systemPrompt = buildClientAngleSystemPrompt({
        instructionPrompt: instruction.systemPrompt,
        baseAngleName: baseAngle.name,
        baseDefinitionMarkdown,
    });

    const userContent = buildClientAngleUserPrompt({
        client,
        baseAngleName: baseAngle.name,
        imageCount: imageBuffers.length,
    });

    const generatedMarkdown = await generate({
        provider,
        model,
        systemPrompt,
        userContent,
        images: imageBuffers,
        responseFormat: 'text',
        temperature: 0.3,
    });

    const trimmedMarkdown = String(generatedMarkdown ?? '').trim();
    if (!trimmedMarkdown) {
        throw new Api400Error('Model returned an empty definition');
    }

    let seriesKey = body.seriesKey?.trim();
    const name = body.name?.trim() || baseAngle.name;

    if (seriesKey) {
        const active = await ClientAngleModel.findOne({ seriesKey, status: 'active' }).lean();
        if (!active) {
            throw new Api400Error(`No active client angle found for seriesKey: ${seriesKey}`);
        }
        if (active.client !== client) {
            throw new Api400Error('seriesKey does not belong to the specified client');
        }
    } else {
        seriesKey = buildClientAngleSeriesKey(client, baseAngle.seriesKey, name);
    }

    const version = await ClientAngleModel.getNextVersion(seriesKey);

    const definitionStorage = await uploadAngleDefinition({
        content: trimmedMarkdown,
        seriesKey,
        version,
        kind: 'client',
    });

    try {
        return await WrapInTransaction(async (session) => {
            await archiveActiveInSeries(seriesKey, session);

            const [created] = await ClientAngleModel.create(
                [
                    {
                        name,
                        client,
                        seriesKey,
                        version,
                        status: 'active',
                        baseAngleId: baseAngle._id,
                        baseAngleSeriesKey: baseAngle.seriesKey,
                        systemInstructionId,
                        referenceImages,
                        definitionStorage,
                        generationMeta: {
                            provider,
                            model,
                            generatedAt: new Date(),
                        },
                    },
                ],
                { session }
            );

            const enriched = enrichClientAngle(created);
            return { ...enriched, definitionMarkdown: trimmedMarkdown };
        });
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(
                `Version ${version} already exists for client angle series "${seriesKey}"`
            );
        }
        throw err;
    }
};

const reviseClientAngleDefinition = async (body) => {
    const definitionMarkdown = body.definitionMarkdown?.trim();
    if (!definitionMarkdown) {
        throw new Api400Error('definitionMarkdown is required');
    }

    const seriesKey = body.seriesKey?.trim();
    if (!seriesKey) {
        throw new Api400Error('seriesKey is required');
    }

    const active = await ClientAngleModel.findOne({ seriesKey, status: 'active' }).lean();
    if (!active) {
        throw new Api400Error(`No active client angle found for seriesKey: ${seriesKey}`);
    }

    const name = body.name?.trim() || active.name;
    const version = await ClientAngleModel.getNextVersion(seriesKey);

    const definitionStorage = await uploadAngleDefinition({
        content: definitionMarkdown,
        seriesKey,
        version,
        kind: 'client',
    });

    try {
        return await WrapInTransaction(async (session) => {
            await archiveActiveInSeries(seriesKey, session);

            const [created] = await ClientAngleModel.create(
                [
                    {
                        name,
                        client: active.client,
                        seriesKey,
                        version,
                        status: 'active',
                        baseAngleId: active.baseAngleId,
                        baseAngleSeriesKey: active.baseAngleSeriesKey,
                        systemInstructionId: active.systemInstructionId,
                        referenceImages: active.referenceImages ?? [],
                        definitionStorage,
                    },
                ],
                { session }
            );

            const enriched = enrichClientAngle(created);
            return { ...enriched, definitionMarkdown };
        });
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(
                `Version ${version} already exists for client angle series "${seriesKey}"`
            );
        }
        throw err;
    }
};

const updateClientAngleName = async (id, name) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid client angle id');
    }

    const trimmed = name?.trim();
    if (!trimmed) {
        throw new Api400Error('name is required');
    }

    const updated = await ClientAngleModel.findOneAndUpdate(
        { _id: id, status: 'active' },
        { $set: { name: trimmed } },
        { new: true, runValidators: true }
    ).lean();

    if (!updated) {
        const exists = await ClientAngleModel.exists({ _id: id });
        if (!exists) {
            throw new Api400Error(`Client angle not found: ${id}`);
        }
        throw new Api400Error('Cannot rename an archived client angle');
    }

    return enrichClientAngle(updated);
};

const archiveClientAngle = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid client angle id');
    }

    const archived = await ClientAngleModel.findOneAndUpdate(
        { _id: id, status: 'active' },
        { $set: { status: 'archived' } },
        { new: true }
    ).lean();

    if (!archived) {
        const exists = await ClientAngleModel.exists({ _id: id });
        if (!exists) {
            throw new Api400Error(`Client angle not found: ${id}`);
        }
        throw new Api400Error('Client angle is already archived');
    }

    return enrichClientAngle(archived);
};

const getClientAngleMetadata = () => ({
    statuses: ANGLE_STATUSES,
    instructionType: CLIENT_ANGLE_INSTRUCTION_TYPE,
    instructionTypes: INSTRUCTION_TYPES,
});

module.exports = {
    listClientAngles,
    listAllClientAngles,
    listClientAngleVersions,
    getClientAngleById,
    presignClientAngleUploads,
    generateClientAngle,
    reviseClientAngleDefinition,
    updateClientAngleName,
    archiveClientAngle,
    getClientAngleMetadata,
};
