const mongoose = require('mongoose');
const BaseAngleModel = require('../models/BaseAngle.model');
const { ANGLE_STATUSES } = require('../models/BaseAngle.model');
const { uploadAngleDefinition, readPromptContent } = require('../models/PromptRegistry.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');
const { buildBaseAngleSeriesKey } = require('../utils/angleKeys');
const { buildSampleImages, enrichBaseAngle } = require('../utils/angleImages');
const { WrapInTransaction } = require('../startup/db');
const {
    getS3PreSignedpath,
} = require('../services/amazonS3Service');
const { buildBaseAngleImageStorageKey } = require('../utils/angleImageStorage');
const { S3_BUCKET } = require('../config');

const archiveActiveInSeries = async (seriesKey, session) => {
    await BaseAngleModel.updateMany(
        { seriesKey, status: 'active' },
        { $set: { status: 'archived' } },
        { session }
    );
};

const listBaseAngles = async ({ q, status, pageNum, pageSize }) => {
    const filter = {};

    const resolvedStatus = status?.trim() || 'active';
    if (resolvedStatus !== 'all') {
        if (!ANGLE_STATUSES.includes(resolvedStatus)) {
            throw new Api400Error(`Invalid status: ${resolvedStatus}`);
        }
        filter.status = resolvedStatus;
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
        BaseAngleModel.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        BaseAngleModel.countDocuments(filter),
    ]);

    return {
        data: rows.map(enrichBaseAngle),
        pagination: {
            total,
            pageNum: resolvedPageNum,
            pageSize: limit,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

const listBaseAngleVersions = async (seriesKey) => {
    const normalized = seriesKey?.trim();
    if (!normalized) {
        throw new Api400Error('seriesKey is required');
    }

    const rows = await BaseAngleModel.find({ seriesKey: normalized })
        .sort({ version: -1 })
        .lean();

    return rows.map(enrichBaseAngle);
};

const getBaseAngleById = async (id, { includeContent = false } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid base angle id');
    }

    const doc = await BaseAngleModel.findById(id).lean();
    if (!doc) {
        throw new Api400Error(`Base angle not found: ${id}`);
    }

    const enriched = enrichBaseAngle(doc);
    if (!includeContent) {
        return enriched;
    }

    const definitionMarkdown = await readPromptContent(doc.definitionStorage);
    return { ...enriched, definitionMarkdown };
};

const presignBaseAngleUploads = async ({ files }) => {
    const presigned = await Promise.all(
        files.map(async (file) => {
            const { fileName, contentType } = file;
            const { key, storageFileName, originalFileName } = buildBaseAngleImageStorageKey(
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

const createBaseAngle = async (body) => {
    const definitionMarkdown = body.definitionMarkdown?.trim();
    if (!definitionMarkdown) {
        throw new Api400Error('definitionMarkdown is required');
    }

    let seriesKey = body.seriesKey?.trim();
    let name = body.name?.trim();

    if (seriesKey) {
        const active = await BaseAngleModel.findOne({ seriesKey, status: 'active' }).lean();
        if (!active) {
            throw new Api400Error(`No active base angle found for seriesKey: ${seriesKey}`);
        }
        name = name || active.name;
    } else {
        if (!name) {
            throw new Api400Error('name is required');
        }
        seriesKey = buildBaseAngleSeriesKey(name);
    }

    const version = await BaseAngleModel.getNextVersion(seriesKey);
    const sampleImages = buildSampleImages(body.sampleImages ?? []);

    const definitionStorage = await uploadAngleDefinition({
        content: definitionMarkdown,
        seriesKey,
        version,
        kind: 'base',
    });

    try {
        return await WrapInTransaction(async (session) => {
            await archiveActiveInSeries(seriesKey, session);

            const [created] = await BaseAngleModel.create(
                [
                    {
                        name,
                        seriesKey,
                        version,
                        status: 'active',
                        definitionStorage,
                        sampleImages,
                    },
                ],
                { session }
            );

            return enrichBaseAngle(created);
        });
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(
                `Version ${version} already exists for base angle series "${seriesKey}"`
            );
        }
        throw err;
    }
};

const updateBaseAngleName = async (id, name) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid base angle id');
    }

    const trimmed = name?.trim();
    if (!trimmed) {
        throw new Api400Error('name is required');
    }

    const updated = await BaseAngleModel.findOneAndUpdate(
        { _id: id, status: 'active' },
        { $set: { name: trimmed } },
        { new: true, runValidators: true }
    ).lean();

    if (!updated) {
        const exists = await BaseAngleModel.exists({ _id: id });
        if (!exists) {
            throw new Api400Error(`Base angle not found: ${id}`);
        }
        throw new Api400Error('Cannot rename an archived base angle');
    }

    return enrichBaseAngle(updated);
};

const archiveBaseAngle = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid base angle id');
    }

    const archived = await BaseAngleModel.findOneAndUpdate(
        { _id: id, status: 'active' },
        { $set: { status: 'archived' } },
        { new: true }
    ).lean();

    if (!archived) {
        const exists = await BaseAngleModel.exists({ _id: id });
        if (!exists) {
            throw new Api400Error(`Base angle not found: ${id}`);
        }
        throw new Api400Error('Base angle is already archived');
    }

    return enrichBaseAngle(archived);
};

const getBaseAngleMetadata = () => ({
    statuses: ANGLE_STATUSES,
});

module.exports = {
    listBaseAngles,
    listBaseAngleVersions,
    getBaseAngleById,
    presignBaseAngleUploads,
    createBaseAngle,
    updateBaseAngleName,
    archiveBaseAngle,
    getBaseAngleMetadata,
};
