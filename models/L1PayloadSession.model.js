const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

const L1_PAYLOAD_SESSION_STATUSES = Object.freeze(['processing', 'completed', 'failed']);

const payloadErrorSchema = new mongoose.Schema(
    { skuId: { type: String, trim: true }, message: { type: String, trim: true } },
    { _id: false }
);

// Same {type, at, meta} shape as L1FeedbackBatch's events, for the same
// reason -- a chronological timeline the UI can render generically.
const eventSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        at: { type: Date, default: Date.now },
        meta: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { _id: false }
);

/**
 * One "Payload Creation" run: a folder of raw <skuId>.json configs (no
 * feedback embedded) + one feedback PPT/DOC, merged into per-SKU files
 * ready for the "SKU config upload" tab. The merged file contents
 * themselves live in L1PayloadFile (one row per SKU, not embedded here --
 * real configs run 500KB+ each, well past what's safe to pile into one
 * Mongo document for a session of 50-100 SKUs).
 */
const L1PayloadSessionSchema = new mongoose.Schema(
    {
        date: { type: String, required: true, trim: true }, // YYYY-MM-DD
        status: { type: String, enum: L1_PAYLOAD_SESSION_STATUSES, default: 'processing' },
        sourceDocName: { type: String, trim: true },
        totalSkus: { type: Number, default: 0 },
        matchedCount: { type: Number, default: 0 },
        unmatchedCount: { type: Number, default: 0 },
        events: { type: [eventSchema], default: [] },
        errors: { type: [payloadErrorSchema], default: [] },
        createdBy: { type: String, trim: true },
    },
    { timestamps: true }
);

L1PayloadSessionSchema.index({ status: 1, createdAt: -1 });

const L1PayloadSessionModel = addModel('l1PayloadSession', L1PayloadSessionSchema, 'L1PayloadSession');

module.exports = L1PayloadSessionModel;
module.exports.L1_PAYLOAD_SESSION_STATUSES = L1_PAYLOAD_SESSION_STATUSES;
