const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const {
    COLOR_MODES,
    FILE_FORMATS,
    DEFAULT_BACKGROUND_COLOR,
} = require('../utils/angleTechnicalSpec');

const dimensionsSchema = {
    width: { type: Number, required: true, min: 1 },
    height: { type: Number, required: true, min: 1 },
    dpi: { type: Number, required: true, min: 1 },
};

const backgroundSchema = {
    color: { type: String, required: true, trim: true, default: DEFAULT_BACKGROUND_COLOR },
};

const fileSpecificationsSchema = {
    colorMode: { type: String, required: true, enum: COLOR_MODES },
    fileFormat: { type: String, required: true, enum: FILE_FORMATS },
};

const AngleTechnicalSpecificationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        client: { type: String, required: true, trim: true },
        dimensions: dimensionsSchema,
        background: backgroundSchema,
        fileSpecifications: fileSpecificationsSchema,
        specHash: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

AngleTechnicalSpecificationSchema.index({ client: 1, specHash: 1 }, { unique: true });
AngleTechnicalSpecificationSchema.index({ client: 1, createdAt: -1 });
AngleTechnicalSpecificationSchema.index({ name: 1 });

const AngleTechnicalSpecificationModel = addModel(
    'angleTechnicalSpecification',
    AngleTechnicalSpecificationSchema,
    'AngleTechnicalSpecification'
);

module.exports = AngleTechnicalSpecificationModel;
module.exports.COLOR_MODES = COLOR_MODES;
module.exports.FILE_FORMATS = FILE_FORMATS;
module.exports.DEFAULT_BACKGROUND_COLOR = DEFAULT_BACKGROUND_COLOR;
