const mongoose = require('mongoose');
const { addModel } = require('../startup/db');
const ImageSchema = require('./Image.schema');

// cropLocation describes where on the image the model crop sits — shape defined by caller (e.g. { x, y, width, height, shape }).
const DescriptionModelImageSchema = new mongoose.Schema(
    {
        modelIdentity: { type: String, required: true, trim: true, ref: 'descriptionModel' },
        originalImage: ImageSchema,
        cropLocation: { type: mongoose.Schema.Types.Mixed },
        croppedImage: ImageSchema,
        isActive: { type: Boolean, default: true },
        // embedding stored separately in imageEmbedding vector table — placeholder flag only
        embeddingDone: { type: Boolean, default: false },
        embeddingRetryCount: { type: Number, default: 0 },
        embeddingFailedPermanently: { type: Boolean, default: false },
    },
    { timestamps: true }
);

DescriptionModelImageSchema.index({ modelIdentity: 1 });

const DescriptionModelImage = addModel('descriptionModelImage', DescriptionModelImageSchema, 'DescriptionModelImage');

module.exports = DescriptionModelImage;
