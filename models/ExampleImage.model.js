const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const ImageSchema = require('./Image.schema');

const EXAMPLE_IMAGE_TYPES = Object.freeze(['good', 'bad']);

const ExampleImageSchema = new mongoose.Schema(
    {
        client: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: EXAMPLE_IMAGE_TYPES,
            required: true,
        },
        tags: {
            type: [{ type: String, trim: true }],
            default: [],
        },
        originalFileName: { type: String, trim: true },
        storageFileName: { type: String, trim: true },
        etag: { type: String, required: true, trim: true },
        image: ImageSchema,
        metadata: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
        uploadedBy: { type: String, trim: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: true },
    }
);

ExampleImageSchema.index({ client: 1, createdAt: -1 });
ExampleImageSchema.index({ client: 1, type: 1 });
ExampleImageSchema.index({ tags: 1 });
ExampleImageSchema.index({ client: 1, etag: 1 }, { unique: true });

const ExampleImageModel = addModel('exampleImage', ExampleImageSchema, 'ExampleImage');

module.exports = ExampleImageModel;
module.exports.EXAMPLE_IMAGE_TYPES = EXAMPLE_IMAGE_TYPES;
