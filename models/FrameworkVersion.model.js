const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const { DOMAINS } = require('../utils/domains');

const FRAMEWORK_VERSION_STATUSES = Object.freeze([
    'draft',
    'in_progress',
    'in_review',
    'approved',
    'promoted',
    'archived',
]);

const domainInstructionSchema = new mongoose.Schema(
    {
        domain: { type: String, required: true, trim: true },
        instructionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'systemInstruction',
            required: true,
        },
        provider: { type: String, required: true, trim: true },
        model: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const FrameworkVersionSchema = new mongoose.Schema({
    frameworkGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'frameworkGroup',
        required: true,
    },
    client: { type: String, required: true, trim: true },
    version: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    status: {
        type: String,
        enum: FRAMEWORK_VERSION_STATUSES,
        default: 'draft',
    },
    domains: {
        type: [{ type: String, trim: true }],
        default: () => [...DOMAINS],
    },
    descriptionGenerationInstructions: {
        type: [domainInstructionSchema],
        default: [],
    },
    frameworkCreationInstructions: {
        type: [domainInstructionSchema],
        default: [],
    },
    inputSet: { type: mongoose.Schema.Types.ObjectId, ref: 'inputSet' },
    frameworkVocabId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'frameworkVocab',
        required: true,
    },
    categoryRegistryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'categoryRegistry',
        required: true,
    },
    knowledgeFields: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    approvedBy: { type: String, trim: true },
    approvedAt: { type: Date },
    promotedBy: { type: String, trim: true },
    promotedAt: { type: Date },
}, { timestamps: true });

FrameworkVersionSchema.index({ frameworkGroupId: 1, version: 1 }, { unique: true });
FrameworkVersionSchema.index({ client: 1, status: 1 });
FrameworkVersionSchema.index({ frameworkGroupId: 1, createdAt: -1 });

const FrameworkVersionModel = addModel(
    'frameworkVersion',
    FrameworkVersionSchema,
    'FrameworkVersion'
);

module.exports = FrameworkVersionModel;
module.exports.FRAMEWORK_VERSION_STATUSES = FRAMEWORK_VERSION_STATUSES;
module.exports.DEFAULT_DOMAINS = DOMAINS;
