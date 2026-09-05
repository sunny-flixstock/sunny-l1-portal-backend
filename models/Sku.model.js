const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const SkuSchema = new mongoose.Schema(
    {
        barcode: { type: String, required: true, trim: true },
        clientName: { type: String, required: true, trim: true },
        associatedTo: { type: String, trim: true },
        patternDict: { type: Object, default: {} },
        createdWithoutCSVDataPreCheck: { type: Boolean, required: true },
        skuCsvId: { type: mongoose.Schema.Types.ObjectId, ref: 'skuCsv' },
        isActive: { type: Boolean, default: true },
        shouldNotProduce: { type: Boolean, default: false },
        filtersSynced: { type: Boolean, default: false },
        skuImageDescription: { type: String },
        garmentCategorization: {
            category: { type: String, trim: true },
            confidence: { type: String, trim: true },
            reasoning: { type: String, trim: true },
        },
        readyForEmbedding: { type: Boolean, default: false },
        embeddingDone: { type: Boolean, default: false },
        ingestionScheduledAt: { type: Date },
        enableFXGTOM: { type: Boolean, required: true },
        assetSeq: { type: Number, default: 0 },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true,
        },
    }
);

SkuSchema.index({ barcode: 1, clientName: 1 }, { unique: true });
// Wildcard index: allows efficient querying on any patternDict sub-key
SkuSchema.index({ 'patternDict.$**': 1 });
SkuSchema.index({ clientName: 1, isActive: 1 });
SkuSchema.index({ shouldNotProduce: 1 }, { partialFilterExpression: { shouldNotProduce: true } });
SkuSchema.index(
    { clientName: 1, associatedTo: 1 },
    { partialFilterExpression: { associatedTo: { $exists: true } } }
);
SkuSchema.index({ readyForEmbedding: 1, embeddingDone: 1 });
SkuSchema.index(
    { clientName: 1, 'garmentCategorization.category': 1 },
    { partialFilterExpression: { 'garmentCategorization.category': { $exists: true } } }
);
SkuSchema.index({ ingestionScheduledAt: 1 }, { sparse: true });

const SkuModel = addModel('sku', SkuSchema, 'Sku');

const nextAssetSeqBlock = async (filter, count = 1) => {
    const doc = await SkuModel.findOneAndUpdate(
        filter,
        { $inc: { assetSeq: count } },
        { new: true, projection: { _id: 1, barcode: 1, clientName: 1, assetSeq: 1 } }
    );
    if (!doc) return null;
    const top = doc.assetSeq;
    const seqs = Array.from({ length: count }, (_, i) => top - count + 1 + i);
    return { sku: doc, seqs };
};

module.exports = SkuModel;
module.exports.nextAssetSeqBlock = nextAssetSeqBlock;
