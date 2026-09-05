const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

// `source` distinguishes a fix that came from a per-SKU RCA issue decision
// (skuId/clientAngleId/variantIndex/depth populated) from one that came from
// a Generic Feedback target decision (genericFeedbackRequestId/targetIndex
// populated) -- same array, either origin, so a version's full provenance
// stays in one place.
const appliedFixSchema = new mongoose.Schema(
    {
        source: { type: String, enum: ['sku', 'generic'], default: 'sku' },
        skuId: { type: String, trim: true },
        clientAngleId: { type: String, trim: true },
        variantIndex: { type: Number },
        depth: { type: Number },
        genericFeedbackRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1GenericFeedbackRequest' },
        targetIndex: { type: Number },
    },
    { _id: false }
);

/**
 * Full linear version history for one L1GroundTruthDocument. `staging`
 * and `live` are movable pointers on the parent document, not a status on
 * this row -- diffing works between any two versions regardless of which
 * pointer(s) reference them. One version is created per document per
 * upload batch (idempotent within that batch): multiple approved fixes
 * in the same HITL run that touch the same file land cumulatively in the
 * same version via `appliedFixes`.
 */
const L1GroundTruthVersionSchema = new mongoose.Schema(
    {
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1GroundTruthDocument', required: true },
        versionNumber: { type: Number, required: true },
        content: { type: String, required: true },
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1FeedbackBatch', default: null },
        appliedFixes: { type: [appliedFixSchema], default: [] },
        createdBy: { type: String, trim: true },
    },
    { timestamps: true }
);

L1GroundTruthVersionSchema.index({ documentId: 1, versionNumber: 1 }, { unique: true });

const L1GroundTruthVersionModel = addModel(
    'l1GroundTruthVersion',
    L1GroundTruthVersionSchema,
    'L1GroundTruthVersion'
);

module.exports = L1GroundTruthVersionModel;
