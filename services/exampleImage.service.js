const mongoose = require('mongoose');
const ExampleImageModel = require('../models/ExampleImage.model');
const { EXAMPLE_IMAGE_TYPES } = require('../models/ExampleImage.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { parseEnumListParam } = require('../utils/parseEnumListParam');
const {
    getS3PreSignedpath,
    checkIfObjectExists,
    getMetaData,
} = require('../services/amazonS3Service');
const { normalizeEtag } = require('../utils/normalizeEtag');
const { buildExampleImageStorageKey } = require('../utils/exampleImageStorage');
const { completeImageObject } = require('../utils/completeImageObject');
const { GetMD5Hash } = require('../utils/crypto');
const { S3_BUCKET, FIXED_THUMB_BUCKET } = require('../config');

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) {
        return [];
    }
    return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
};

const assertClientExists = async (client) => {
    const exists = await ClientModel.exists({ code: client });
    if (!exists) {
        throw new Api400Error(`Client not found: ${client}`);
    }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getS3ObjectEtag = async (imageKey, bucket = S3_BUCKET, { retries = 5, delayMs = 400 } = {}) => {
    for (let attempt = 0; attempt < retries; attempt += 1) {
        const metadata = await getMetaData(bucket, imageKey);
        if (metadata && typeof metadata !== 'string') {
            const etag = normalizeEtag(metadata.ETag);
            if (etag) {
                return etag;
            }
        }
        if (attempt < retries - 1) {
            await delay(delayMs);
        }
    }
    throw new Api400Error(`Uploaded file not found in storage or ETag unavailable: ${imageKey}`);
};

const assertExampleImageUnique = async ({ client, etag, excludeId }) => {
    const normalizedEtag = normalizeEtag(etag);
    if (!normalizedEtag) {
        throw new Api400Error('etag is required');
    }

    const filter = {
        client,
        etag: normalizedEtag,
    };

    if (excludeId) {
        filter._id = { $ne: excludeId };
    }

    const existing = await ExampleImageModel.findOne(filter)
        .select({ _id: 1, originalFileName: 1, type: 1 })
        .lean();

    if (existing) {
        const label = existing.originalFileName ? ` (${existing.originalFileName})` : '';
        throw new Api400Error(
            `Duplicate example image for client "${client}": this file was already uploaded${label}`
        );
    }

    return normalizedEtag;
};

const enrichExampleImage = (doc) => {
    if (!doc) return doc;
    const plain = { ...doc };
    if (plain.image) {
        completeImageObject(plain.image);
    }
    return plain;
};

const getExpectedThumbKey = async (imagePathKey) => {
    const hash = await GetMD5Hash(imagePathKey);
    const subHash = hash.substring(0, 3);
    return `thumbs/${subHash}/${hash}.webp`;
};

const isThumbnailReady = async (imagePathKey) => {
    if (!imagePathKey) {
        return false;
    }
    const thumbKey = await getExpectedThumbKey(imagePathKey);
    return checkIfObjectExists(FIXED_THUMB_BUCKET, thumbKey);
};

const listExampleImages = async ({
    client,
    type,
    tags,
    pageNum,
    pageSize,
}) => {
    const filter = {};

    if (client) {
        filter.client = client.trim();
    }

    const typeValues = parseEnumListParam(type);
    if (typeValues.length) {
        const invalid = typeValues.filter((value) => !EXAMPLE_IMAGE_TYPES.includes(value));
        if (invalid.length) {
            throw new Api400Error(`Invalid type: ${invalid.join(', ')}`);
        }
        filter.type = { $in: typeValues };
    }

    const tagValues = parseEnumListParam(tags);
    if (tagValues.length) {
        filter.tags = { $in: tagValues };
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [rows, total] = await Promise.all([
        ExampleImageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ExampleImageModel.countDocuments(filter),
    ]);

    return {
        data: rows.map(enrichExampleImage),
        pagination: {
            total,
            pageNum: resolvedPageNum,
            pageSize: limit,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

const listDistinctTags = async (client) => {
    const filter = {};
    if (client) {
        filter.client = client.trim();
    }
    const tags = await ExampleImageModel.distinct('tags', filter);
    return tags.filter(Boolean).sort((a, b) => a.localeCompare(b));
};

const getExampleImageById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid example image id');
    }

    const doc = await ExampleImageModel.findById(id).lean();
    if (!doc) {
        throw new Api400Error(`Example image not found: ${id}`);
    }
    return enrichExampleImage(doc);
};

const presignExampleImageUploads = async ({ client, files }) => {
    await assertClientExists(client);

    const presigned = await Promise.all(
        files.map(async (file) => {
            const { fileName, contentType } = file;
            const { key, storageFileName, originalFileName } = buildExampleImageStorageKey(
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

const createExampleImage = async (body) => {
    const client = body.client.trim();
    await assertClientExists(client);

    if (!EXAMPLE_IMAGE_TYPES.includes(body.type)) {
        throw new Api400Error(`Invalid type: ${body.type}`);
    }

    const imageKey = body.imageKey.trim();
    if (!imageKey.startsWith(`framework_example_images/${client}/`)) {
        throw new Api400Error('imageKey does not match expected storage path for client');
    }

    const s3Etag = await getS3ObjectEtag(imageKey, S3_BUCKET);
    const clientEtag = normalizeEtag(body.etag);

    if (clientEtag && clientEtag !== s3Etag) {
        throw new Api400Error('etag does not match uploaded file in storage');
    }

    const etag = await assertExampleImageUnique({
        client,
        etag: s3Etag,
    });

    try {
        const doc = await ExampleImageModel.create({
            client,
            type: body.type,
            etag,
            tags: normalizeTags(body.tags),
            originalFileName: body.originalFileName?.trim() || undefined,
            storageFileName: body.storageFileName?.trim() || undefined,
            uploadedBy: body.uploadedBy?.trim() || undefined,
            image: {
                name: body.storageFileName?.trim() || body.originalFileName?.trim(),
                imagePath: {
                    key: imageKey,
                    host: S3_BUCKET,
                    channel: 's3',
                },
            },
        });

        return enrichExampleImage(doc.toObject());
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(
                `Duplicate example image for client "${client}": this file was already uploaded`
            );
        }
        throw err;
    }
};

const updateExampleImage = async (id, body) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid example image id');
    }

    const existing = await ExampleImageModel.findById(id).lean();
    if (!existing) {
        throw new Api400Error(`Example image not found: ${id}`);
    }

    const update = {};

    if (body.type != null) {
        if (!EXAMPLE_IMAGE_TYPES.includes(body.type)) {
            throw new Api400Error(`Invalid type: ${body.type}`);
        }
        update.type = body.type;
    }

    if (body.tags != null) {
        update.tags = normalizeTags(body.tags);
    }

    if (body.uploadedBy != null) {
        update.uploadedBy = body.uploadedBy.trim() || undefined;
    }

    try {
        const updated = await ExampleImageModel.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true, runValidators: true }
        ).lean();

        if (!updated) {
            throw new Api400Error(`Example image not found: ${id}`);
        }

        return enrichExampleImage(updated);
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(
                `Duplicate example image for client "${existing.client}": this file was already uploaded`
            );
        }
        throw err;
    }
};

const batchUpdateExampleImages = async (updates) => {
    const results = [];

    for (const item of updates) {
        const updated = await updateExampleImage(item.id, item);
        results.push(updated);
    }

    return results;
};

const getThumbnailStatus = async (ids) => {
    const objectIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const docs = await ExampleImageModel.find({ _id: { $in: objectIds } })
        .select({ image: 1 })
        .lean();

    const statusById = new Map(
        await Promise.all(
            docs.map(async (doc) => {
                const imageKey = doc.image?.imagePath?.key;
                const ready = await isThumbnailReady(imageKey);
                return [String(doc._id), ready];
            })
        )
    );

    return ids.map((id) => ({
        id,
        thumbnailReady: statusById.get(String(id)) ?? false,
    }));
};

const deleteExampleImage = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid example image id');
    }

    const deleted = await ExampleImageModel.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new Api400Error(`Example image not found: ${id}`);
    }

    return enrichExampleImage(deleted);
};

const getExampleImageMetadata = () => ({
    types: EXAMPLE_IMAGE_TYPES,
});

module.exports = {
    listExampleImages,
    listDistinctTags,
    getExampleImageById,
    presignExampleImageUploads,
    createExampleImage,
    updateExampleImage,
    batchUpdateExampleImages,
    getThumbnailStatus,
    deleteExampleImage,
    getExampleImageMetadata,
};
