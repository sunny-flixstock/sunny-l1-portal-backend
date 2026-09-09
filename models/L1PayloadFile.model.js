const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

// Whether a human has visually confirmed this specific extracted feedback
// item is actually mapped to the right image/SKU/angle/variant -- the
// Feedback Verification tab's whole purpose, done before this ever reaches
// RCA. 'pending' until a person clicks Correct/Wrong Mapping there.
const verificationSchema = new mongoose.Schema(
    {
        status: { type: String, enum: ['pending', 'correct', 'wrong'], default: 'pending' },
        verifiedAt: { type: Date, default: null },
        verifiedBy: { type: String, default: null },
    },
    { _id: false }
);

// The original QC screenshot this item's angle/variant was matched from --
// persisted (not just used in-flight for the matching LLM call) so
// Feedback Verification can show it next to the resolved candidate image.
// Small enough per-item to store directly, same pattern as
// L1GenericFeedbackRequest.images.
const screenshotImageSchema = new mongoose.Schema(
    {
        data: { type: Buffer, required: true },
        mimeType: { type: String, required: true },
    },
    { _id: false }
);

// One individually-extracted (angle, variant, feedback) item merged into
// this SKU's config -- kept as its own record (not just an aggregate
// count) specifically so the Feedback Verification tab can render one card
// per item: the original screenshot, the real image it was matched to, and
// the feedback text. clientAngleId/angleName/variantIndex are now resolved
// by comparing the screenshot against this SKU's own real candidate images
// (see l1PayloadSession.service's matchScreenshotsToVariants) -- the
// source document no longer states them.
const mergedItemSchema = new mongoose.Schema(
    {
        clientAngleId: { type: String, required: true },
        angleName: { type: String, default: null }, // from the matched candidate, not extracted text
        variantIndex: { type: Number, required: true },
        feedbackText: { type: String, required: true },
        matchConfidence: { type: String, enum: ['high', 'medium', 'low', null], default: null },
        matchReasoning: { type: String, default: null }, // why the image-matching step picked this candidate
        imageUrl: { type: String, default: null }, // the actual variant.output this item was matched to
        screenshotImage: { type: screenshotImageSchema, default: null },
        verification: { type: verificationSchema, default: () => ({}) },
    },
    { _id: false }
);

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
        mergedItems: { type: [mergedItemSchema], default: [] },
        warnings: { type: [String], default: [] },
    },
    { timestamps: true }
);

L1PayloadFileSchema.index({ sessionId: 1, skuId: 1 }, { unique: true });

const L1PayloadFileModel = addModel('l1PayloadFile', L1PayloadFileSchema, 'L1PayloadFile');

module.exports = L1PayloadFileModel;
