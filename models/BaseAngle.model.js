const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const ImageSchema = require('./Image.schema');
const { promptStorageSchema } = require('./PromptRegistry.model');

const ANGLE_STATUSES = Object.freeze(['active', 'archived']);

const BaseAngleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        seriesKey: { type: String, required: true, trim: true },
        version: { type: Number, required: true, min: 1 },
        status: {
            type: String,
            enum: ANGLE_STATUSES,
            default: 'active',
        },
        definitionStorage: promptStorageSchema,
        sampleImages: {
            type: [ImageSchema],
            default: [],
        },
    },
    { timestamps: true }
);

BaseAngleSchema.index({ seriesKey: 1, version: 1 }, { unique: true });
BaseAngleSchema.index(
    { seriesKey: 1 },
    { unique: true, partialFilterExpression: { status: 'active' } }
);
BaseAngleSchema.index({ status: 1, updatedAt: -1 });
BaseAngleSchema.index({ name: 1 });

BaseAngleSchema.statics.getNextVersion = async function (seriesKey) {
    const latest = await this.findOne({ seriesKey })
        .sort({ version: -1 })
        .select('version')
        .lean();
    return (latest?.version ?? 0) + 1;
};

const BaseAngleModel = addModel('baseAngle', BaseAngleSchema, 'BaseAngle');

module.exports = BaseAngleModel;
module.exports.ANGLE_STATUSES = ANGLE_STATUSES;
