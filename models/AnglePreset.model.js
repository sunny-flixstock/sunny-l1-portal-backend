const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const imageSpecEntrySchema = {
    angleTechnicalSpecificationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'angleTechnicalSpecification',
        required: true,
    },
    namingPattern: { type: String, required: true, trim: true },
};

const presetEntrySchema = {
    clientAngleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'clientAngle',
        required: true,
    },
    imageSpecs: {
        type: [imageSpecEntrySchema],
        required: true,
        validate: {
            validator: (value) => Array.isArray(value) && value.length >= 1,
            message: 'Each preset entry must have at least one image specification',
        },
    },
};

const AnglePresetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        client: { type: String, required: true, trim: true },
        entries: {
            type: [presetEntrySchema],
            required: true,
            validate: {
                validator: (value) => Array.isArray(value) && value.length >= 1,
                message: 'At least one client angle entry is required',
            },
        },
    },
    { timestamps: true }
);

AnglePresetSchema.index({ client: 1, name: 1 }, { unique: true });
AnglePresetSchema.index({ client: 1, updatedAt: -1 });

const AnglePresetModel = addModel('anglePreset', AnglePresetSchema, 'AnglePreset');

module.exports = AnglePresetModel;
