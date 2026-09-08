const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

/**
 * One staged, feedback-merged SKU config file belonging to an
 * L1PayloadSession. Kept as its own document (not embedded in the
 * session) since a real config is 500KB+ -- a 50-100 SKU session would
 * blow past Mongo's 16MB single-document cap if these were embedded.
 */
const L1PayloadFileSchema = new mongoose.Schema(
    {
        sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1PayloadSession', required: true },
        skuId: { type: String, required: true, trim: true },
        content: { type: String, required: true }, // the final JSON, feedback merged in, stringified
        matchedFeedbackCount: { type: Number, default: 0 },
        warnings: { type: [String], default: [] },
    },
    { timestamps: true }
);

L1PayloadFileSchema.index({ sessionId: 1, skuId: 1 }, { unique: true });

const L1PayloadFileModel = addModel('l1PayloadFile', L1PayloadFileSchema, 'L1PayloadFile');

module.exports = L1PayloadFileModel;
