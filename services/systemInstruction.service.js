const mongoose = require('mongoose');
const SystemInstructionModel = require('../models/SystemInstruction.model');
const {
    INSTRUCTION_TYPES,
    INSTRUCTION_TYPE_LABELS,
    INSTRUCTION_STATUSES,
    buildSeriesKey,
} = require('../models/SystemInstruction.model');
const {
    uploadPromptContent,
    readPromptContent,
} = require('../models/PromptRegistry.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');

const toLeanInstruction = (doc) => (doc?.toObject ? doc.toObject() : doc);

const listInstructionTypes = async () => {
    const counts = await SystemInstructionModel.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$instructionType', count: { $sum: 1 } } },
    ]);

    const countByType = Object.fromEntries(counts.map((row) => [row._id, row.count]));

    return INSTRUCTION_TYPES.map((type) => ({
        instructionType: type,
        label: INSTRUCTION_TYPE_LABELS[type] ?? type,
        activeCount: countByType[type] ?? 0,
    }));
};

const listSystemInstructions = async ({
    instructionType,
    status,
    seriesKey,
    q,
    pageNum,
    pageSize,
}) => {
    const filter = {};

    if (instructionType) {
        if (!INSTRUCTION_TYPES.includes(instructionType)) {
            throw new Api400Error(`Invalid instructionType: ${instructionType}`);
        }
        filter.instructionType = instructionType;
    }

    if (status) {
        if (!INSTRUCTION_STATUSES.includes(status)) {
            throw new Api400Error(`Invalid status: ${status}`);
        }
        filter.status = status;
    }

    if (seriesKey) {
        filter.seriesKey = seriesKey.trim();
    }

    if (q) {
        const pattern = escapeRegex(q);
        filter.$or = [
            { name: { $regex: pattern, $options: 'i' } },
            { purpose: { $regex: pattern, $options: 'i' } },
        ];
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [data, total] = await Promise.all([
        SystemInstructionModel.find(filter)
            .sort({ instructionType: 1, seriesKey: 1, version: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        SystemInstructionModel.countDocuments(filter),
    ]);

    return {
        data,
        pagination: {
            total,
            pageNum: resolvedPageNum,
            pageSize: limit,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

const getSystemInstructionById = async (id, { includeContent = false } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid system instruction id');
    }

    const doc = await SystemInstructionModel.findById(id).lean();
    if (!doc) {
        throw new Api400Error(`System instruction not found: ${id}`);
    }

    if (!includeContent) {
        return doc;
    }

    const systemPrompt = await readPromptContent(doc.storage);
    return { ...doc, systemPrompt };
};

const createSystemInstruction = async (body) => {
    const name = body.name.trim();
    const purpose = body.purpose.trim();
    const instructionType = body.instructionType;
    const systemPrompt = body.systemPrompt?.trim();

    if (!systemPrompt) {
        throw new Api400Error('systemPrompt is required');
    }

    if (!INSTRUCTION_TYPES.includes(instructionType)) {
        throw new Api400Error(`Invalid instructionType: ${instructionType}`);
    }

    let seriesKey = body.seriesKey?.trim();
    if (!seriesKey) {
        seriesKey = buildSeriesKey(instructionType, name);
    }

    const version = await SystemInstructionModel.getNextVersion(seriesKey);

    const storage = await uploadPromptContent({
        content: systemPrompt,
        instructionType,
        seriesKey,
        version,
    });

    let outputSchema = {};
    if (body.outputSchema != null && body.outputSchema !== '') {
        if (typeof body.outputSchema === 'string') {
            try {
                outputSchema = JSON.parse(body.outputSchema);
            } catch {
                throw new Api400Error('outputSchema must be valid JSON');
            }
        } else {
            outputSchema = body.outputSchema;
        }
    }

    try {
        return await SystemInstructionModel.create({
            name,
            instructionType,
            seriesKey,
            version,
            purpose,
            storage,
            outputSchema,
            status: 'active',
        });
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(
                `Version ${version} already exists for instruction series "${seriesKey}"`
            );
        }
        throw err;
    }
};

const updateSystemInstructionName = async (id, name) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid system instruction id');
    }

    const trimmed = name?.trim();
    if (!trimmed) {
        throw new Api400Error('name is required');
    }

    const updated = await SystemInstructionModel.findOneAndUpdate(
        { _id: id, status: 'active' },
        { $set: { name: trimmed } },
        { new: true, runValidators: true }
    ).lean();

    if (!updated) {
        const exists = await SystemInstructionModel.exists({ _id: id });
        if (!exists) {
            throw new Api400Error(`System instruction not found: ${id}`);
        }
        throw new Api400Error('Cannot rename an archived system instruction');
    }

    return updated;
};

const archiveSystemInstruction = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid system instruction id');
    }

    const archived = await SystemInstructionModel.findOneAndUpdate(
        { _id: id, status: 'active' },
        { $set: { status: 'archived' } },
        { new: true }
    ).lean();

    if (!archived) {
        const exists = await SystemInstructionModel.exists({ _id: id });
        if (!exists) {
            throw new Api400Error(`System instruction not found: ${id}`);
        }
        throw new Api400Error('System instruction is already archived');
    }

    return archived;
};

const getSystemInstructionMetadata = () => ({
    instructionTypes: INSTRUCTION_TYPES,
    instructionTypeLabels: INSTRUCTION_TYPE_LABELS,
    statuses: INSTRUCTION_STATUSES,
});

module.exports = {
    listInstructionTypes,
    listSystemInstructions,
    getSystemInstructionById,
    createSystemInstruction,
    updateSystemInstructionName,
    archiveSystemInstruction,
    getSystemInstructionMetadata,
    toLeanInstruction,
};
