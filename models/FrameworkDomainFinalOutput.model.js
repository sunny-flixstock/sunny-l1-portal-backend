const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const { STORAGE_TYPES } = require('./PromptRegistry.model');
const {
    IMAGE_DESCRIPTION_STATUSES,
    IMAGE_DESCRIPTION_STATUS_VALUES,
} = require('./ImageDescription.model');

const frameworkDomainOutputStorageSchema = {
    type: {
        type: String,
        enum: STORAGE_TYPES,
        default: 's3',
    },
    bucket: { type: String, trim: true },
    key: { type: String, trim: true },
    url: { type: String, trim: true },
};

const FrameworkDomainFinalOutputSchema = new mongoose.Schema(
    {
        frameworkVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'frameworkVersion',
            required: true,
        },
        domain: { type: String, required: true, trim: true },
        descriptionGroupIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'descriptionGroup' }],
            default: [],
        },
        status: {
            type: Number,
            enum: IMAGE_DESCRIPTION_STATUS_VALUES,
            default: IMAGE_DESCRIPTION_STATUSES.pending,
            required: true,
        },
        description: frameworkDomainOutputStorageSchema,
        llmPayloadStorage: frameworkDomainOutputStorageSchema,
        rejectionReason: { type: String, trim: true, default: '' },
    },
    { timestamps: true }
);

FrameworkDomainFinalOutputSchema.index({ frameworkVersionId: 1, domain: 1 }, { unique: true });
FrameworkDomainFinalOutputSchema.index({ frameworkVersionId: 1 });
FrameworkDomainFinalOutputSchema.index({ status: 1 });

const FrameworkDomainFinalOutputModel = addModel(
    'frameworkDomainFinalOutput',
    FrameworkDomainFinalOutputSchema,
    'FrameworkDomainFinalOutput'
);

module.exports = FrameworkDomainFinalOutputModel;
module.exports.IMAGE_DESCRIPTION_STATUSES = IMAGE_DESCRIPTION_STATUSES;
module.exports.IMAGE_DESCRIPTION_STATUS_VALUES = IMAGE_DESCRIPTION_STATUS_VALUES;
module.exports.frameworkDomainOutputStorageSchema = frameworkDomainOutputStorageSchema;
