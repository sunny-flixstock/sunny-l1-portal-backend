const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const IMAGE_DESCRIPTION_STATUSES = Object.freeze({
    pending: 600,
    assigned: 601,
    selected: 602,
    inProgress: 604,
    completed: 606,
    rejected: 608,
});

const IMAGE_DESCRIPTION_STATUS_VALUES = Object.freeze(
    Object.values(IMAGE_DESCRIPTION_STATUSES)
);

const MAX_IMAGE_DESCRIPTION_RETRIES = 2;

const ImageDescriptionSchema = new mongoose.Schema(
    {
        imageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'exampleImage',
            required: true,
        },
        descriptionInstruction: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'systemInstruction',
            required: true,
        },
        domains: {
            type: [{ type: String, trim: true }],
            default: [],
        },
        provider: { type: String, required: true, trim: true },
        model: { type: String, required: true, trim: true },
        domainCacheKey: { type: String, required: true, trim: true },
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
        description: { type: String, trim: true, default: '' },
        status: {
            type: Number,
            enum: IMAGE_DESCRIPTION_STATUS_VALUES,
            default: IMAGE_DESCRIPTION_STATUSES.pending,
            required: true,
        },
        rejectionReason: { type: String, trim: true, default: '' },
        retryCount: { type: Number, default: 0, min: 0, required: true },
    },
    { timestamps: true }
);

ImageDescriptionSchema.index(
    {
        imageId: 1,
        descriptionInstruction: 1,
        provider: 1,
        model: 1,
        domainCacheKey: 1,
    },
    { unique: true }
);
ImageDescriptionSchema.index({ status: 1 });
ImageDescriptionSchema.index({ imageId: 1 });
ImageDescriptionSchema.index({ domainCacheKey: 1 });
ImageDescriptionSchema.index({ frameworkVocabId: 1, categoryRegistryId: 1 });

const ImageDescriptionModel = addModel(
    'imageDescription',
    ImageDescriptionSchema,
    'ImageDescription'
);

module.exports = ImageDescriptionModel;
module.exports.IMAGE_DESCRIPTION_STATUSES = IMAGE_DESCRIPTION_STATUSES;
module.exports.IMAGE_DESCRIPTION_STATUS_VALUES = IMAGE_DESCRIPTION_STATUS_VALUES;
module.exports.MAX_IMAGE_DESCRIPTION_RETRIES = MAX_IMAGE_DESCRIPTION_RETRIES;
