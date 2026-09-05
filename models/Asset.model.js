const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const ImageSchema = require('./Image.schema');

const AssetSchema = new mongoose.Schema(
    {
        skuId: { type: mongoose.Schema.Types.ObjectId, ref: 'sku', required: true },
        barcode: { type: String, required: true, trim: true },
        clientName: { type: String, required: true, trim: true },
        associatedTo: { type: String, trim: true },
        image: ImageSchema,
        patternDict: { type: mongoose.Schema.Types.Mixed },
        isActive: { type: Boolean, default: true },
        shouldNotProduce: { type: Boolean, default: false },
        usageCounter: { type: Number, default: 0 },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true,
        },
    }
);

// Compound index for the primary search pattern: find assets by barcode + company
AssetSchema.index({ barcode: 1, clientName: 1 });
// Wildcard index: allows efficient querying on any patternDict sub-key
AssetSchema.index({ 'patternDict.$**': 1 });
AssetSchema.index({ clientName: 1, isActive: 1 });
AssetSchema.index({ shouldNotProduce: 1 }, { partialFilterExpression: { shouldNotProduce: true } });
AssetSchema.index(
    { clientName: 1, associatedTo: 1, isActive: 1 },
    { partialFilterExpression: { associatedTo: { $exists: true } } }
);
// Supports the displayAsset aggregation in searchSkus: match by skuId + isActive
AssetSchema.index({ skuId: 1, isActive: 1 });
// Uniqueness: one active asset per SKU + image source (host + key)
AssetSchema.index(
    { skuId: 1, 'image.imagePath.host': 1, 'image.imagePath.key': 1 },
    { unique: true, partialFilterExpression: { isActive: true } }
);

const AssetModel = addModel('asset', AssetSchema, 'Asset');

module.exports = AssetModel;
