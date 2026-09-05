const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const {
    IMAGE_DESCRIPTION_STATUSES,
    IMAGE_DESCRIPTION_STATUS_VALUES,
} = require('./ImageDescription.model');
const { optionalPromptStorageSchema } = require('./PromptRegistry.model');

const DescriptionGroupSchema = new mongoose.Schema(
    {
        imageDescriptionIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'imageDescription' }],
            default: [],
        },
        domain: { type: String, required: true, trim: true },
        frameworkCreationInstruction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'systemInstruction',
            required: true,
        },
        provider: { type: String, required: true, trim: true },
        model: { type: String, required: true, trim: true },
        status: {
            type: Number,
            enum: IMAGE_DESCRIPTION_STATUS_VALUES,
            default: IMAGE_DESCRIPTION_STATUSES.pending,
            required: true,
        },
        description: { type: String, trim: true, default: '' },
        rejectionReason: { type: String, trim: true, default: '' },
        llmPayloadStorage: optionalPromptStorageSchema,
        domainCacheKey: { type: String, required: true, trim: true },
        ruleIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'rule' }],
            default: [],
        },
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
    },
    { timestamps: true }
);

DescriptionGroupSchema.index({
    domain: 1,
    provider: 1,
    model: 1,
    frameworkCreationInstruction: 1,
    domainCacheKey: 1,
});
DescriptionGroupSchema.index({ status: 1 });

const DescriptionGroupModel = addModel(
    'descriptionGroup',
    DescriptionGroupSchema,
    'DescriptionGroup'
);

module.exports = DescriptionGroupModel;
module.exports.IMAGE_DESCRIPTION_STATUSES = IMAGE_DESCRIPTION_STATUSES;
module.exports.IMAGE_DESCRIPTION_STATUS_VALUES = IMAGE_DESCRIPTION_STATUS_VALUES;
