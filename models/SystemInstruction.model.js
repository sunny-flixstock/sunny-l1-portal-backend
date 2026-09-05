const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const { STORAGE_TYPES } = require('./PromptRegistry.model');

const promptStorageSchema = {
    type: {
        type: String,
        enum: STORAGE_TYPES,
        default: 's3',
    },
    bucket: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
};

const INSTRUCTION_STATUSES = Object.freeze(['active', 'archived']);

const INSTRUCTION_TYPES = Object.freeze([
    'image_description',
    'framework_builder',
    'category_identification',
    'client_angle_definition',
]);

const INSTRUCTION_TYPE_LABELS = Object.freeze({
    image_description: 'Example image description generation',
    framework_builder: 'Framework creation and storage',
    category_identification: 'Example image categorization',
    client_angle_definition: 'Client angle definition generation',
});

const slugifySeriesSegment = (value) =>
    value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const buildSeriesKey = (instructionType, name) => {
    const slug = slugifySeriesSegment(name);
    if (!slug) {
        throw new Error('Instruction name must contain at least one alphanumeric character');
    }
    return `${instructionType}/${slug}`;
};

const SystemInstructionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        instructionType: {
            type: String,
            enum: INSTRUCTION_TYPES,
            required: true,
        },
        seriesKey: { type: String, required: true, trim: true },
        version: { type: Number, required: true, min: 1 },
        purpose: { type: String, required: true, trim: true },
        storage: promptStorageSchema,
        outputSchema: { type: mongoose.Schema.Types.Mixed, default: {} },
        status: {
            type: String,
            enum: INSTRUCTION_STATUSES,
            default: 'active',
        },
    },
    { timestamps: true }
);

SystemInstructionSchema.index({ seriesKey: 1, version: 1 }, { unique: true });
SystemInstructionSchema.index({ instructionType: 1, status: 1, createdAt: -1 });
SystemInstructionSchema.index({ instructionType: 1, seriesKey: 1, version: -1 });

SystemInstructionSchema.statics.getNextVersion = async function (seriesKey) {
    const latest = await this.findOne({ seriesKey })
        .sort({ version: -1 })
        .select('version')
        .lean();
    return (latest?.version ?? 0) + 1;
};

const SystemInstructionModel = addModel(
    'systemInstruction',
    SystemInstructionSchema,
    'SystemInstruction'
);

module.exports = SystemInstructionModel;
module.exports.INSTRUCTION_STATUSES = INSTRUCTION_STATUSES;
module.exports.INSTRUCTION_TYPES = INSTRUCTION_TYPES;
module.exports.INSTRUCTION_TYPE_LABELS = INSTRUCTION_TYPE_LABELS;
module.exports.buildSeriesKey = buildSeriesKey;
