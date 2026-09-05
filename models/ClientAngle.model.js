const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const ImageSchema = require('./Image.schema');
const { promptStorageSchema } = require('./PromptRegistry.model');

const ANGLE_STATUSES = Object.freeze(['active', 'archived']);

const generationMetaSchema = {
    provider: { type: String, trim: true },
    model: { type: String, trim: true },
    generatedAt: { type: Date },
};

const ClientAngleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        client: { type: String, required: true, trim: true },
        seriesKey: { type: String, required: true, trim: true },
        version: { type: Number, required: true, min: 1 },
        status: {
            type: String,
            enum: ANGLE_STATUSES,
            default: 'active',
        },
        baseAngleId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'baseAngle',
            required: true,
        },
        baseAngleSeriesKey: { type: String, required: true, trim: true },
        systemInstructionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'systemInstruction',
            required: true,
        },
        referenceImages: {
            type: [ImageSchema],
            default: [],
        },
        definitionStorage: promptStorageSchema,
        generationMeta: generationMetaSchema,
    },
    { timestamps: true }
);

ClientAngleSchema.index({ seriesKey: 1, version: 1 }, { unique: true });
ClientAngleSchema.index(
    { seriesKey: 1 },
    { unique: true, partialFilterExpression: { status: 'active' } }
);
ClientAngleSchema.index({ client: 1, baseAngleSeriesKey: 1, version: -1 });
ClientAngleSchema.index({ client: 1, status: 1, updatedAt: -1 });
ClientAngleSchema.index({ baseAngleSeriesKey: 1, status: 1 });

ClientAngleSchema.statics.getNextVersion = async function (seriesKey) {
    const latest = await this.findOne({ seriesKey })
        .sort({ version: -1 })
        .select('version')
        .lean();
    return (latest?.version ?? 0) + 1;
};

const ClientAngleModel = addModel('clientAngle', ClientAngleSchema, 'ClientAngle');

module.exports = ClientAngleModel;
module.exports.ANGLE_STATUSES = ANGLE_STATUSES;
