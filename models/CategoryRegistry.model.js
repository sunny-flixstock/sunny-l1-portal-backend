const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const CategoryRegistrySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        registry: { type: mongoose.Schema.Types.Mixed, required: true },
        contentHash: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

CategoryRegistrySchema.index({ contentHash: 1 });
CategoryRegistrySchema.index({ createdAt: -1 });
CategoryRegistrySchema.index({ name: 1 });

const CategoryRegistryModel = addModel(
    'categoryRegistry',
    CategoryRegistrySchema,
    'CategoryRegistry'
);

module.exports = CategoryRegistryModel;
