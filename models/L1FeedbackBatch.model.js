const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

const L1_BATCH_STATUSES = Object.freeze(['processing', 'diagnosed', 'failed']);

const uploadedFileSchema = new mongoose.Schema(
    {
        skuId: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const batchErrorSchema = new mongoose.Schema(
    {
        skuId: { type: String, trim: true },
        message: { type: String, trim: true },
    },
    { _id: false }
);

// Chronological record of everything that happened to this session, for the
// Batch/Session History UI's timeline -- additive alongside the existing
// per-array-field tracking below, not a replacement for it.
const eventSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        at: { type: Date, default: Date.now },
        meta: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { _id: false }
);

const L1FeedbackBatchSchema = new mongoose.Schema(
    {
        status: { type: String, enum: L1_BATCH_STATUSES, default: 'processing' },
        uploadedFiles: { type: [uploadedFileSchema], default: [] },
        events: { type: [eventSchema], default: [] },
        // Incremental progress, updated after every SKU as it happens (not
        // just once at the end) so the UI can poll and show real live
        // progress instead of one long blind wait.
        totalSkus: { type: Number, default: 0 },
        skuIds: { type: [String], default: [] }, // ingested (has feedback)
        diagnosedSkuIds: { type: [String], default: [] }, // subset of skuIds whose RCA call finished
        // SKUs deliberately gated out because no variant carried actual
        // feedback -- this is expected, correct behavior, not a failure,
        // so it's tracked separately from `errors` (genuine problems:
        // malformed config, a DB write failing, an RCA call throwing).
        rejectedSkuIds: { type: [String], default: [] },
        errors: { type: [batchErrorSchema], default: [] },
        createdBy: { type: String, trim: true },
    },
    { timestamps: true }
);

L1FeedbackBatchSchema.index({ status: 1, createdAt: -1 });

const L1FeedbackBatchModel = addModel('l1FeedbackBatch', L1FeedbackBatchSchema, 'L1FeedbackBatch');

module.exports = L1FeedbackBatchModel;
module.exports.L1_BATCH_STATUSES = L1_BATCH_STATUSES;
