const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

const DescriptionModelSchema = new mongoose.Schema(
    {
        modelIdentity: { type: String, required: true, unique: true, trim: true, immutable: true },
        name: { type: String, required: true, trim: true },
        heightInCM: { type: Number, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const DescriptionModel = addModel('descriptionModel', DescriptionModelSchema, 'DescriptionModel');

module.exports = DescriptionModel;
