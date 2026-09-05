const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

const L1_GENERIC_FEEDBACK_STATUSES = Object.freeze(['processing', 'diagnosed', 'failed']);

// Only the S3 key is persisted -- the signed GET `url` is always
// regenerated fresh at read time (see l1GenericFeedback.service's
// withFreshImageUrls) rather than stored, since a signed URL captured at
// upload time would go stale in long-lived session history.
const imageSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, trim: true },
        mimeType: { type: String, trim: true },
    },
    { _id: false }
);

// Same shape as an L1SkuTrace RCA_Iteration's `candidates` -- deliberately,
// so the HITL approval UI and the edit-apply code path
// (l1HitlReview.service's applyEditToDocumentContent /
// l1GroundTruth.service's getOrCreateBatchStagingVersion) are reused as-is
// for this second intake path instead of duplicated.
const candidateSchema = new mongoose.Schema(
    {
        location: { type: String, required: true },
        action: { type: String, enum: ['update', 'add', 'remove'], required: true },
        detail: { type: String, required: true },
        rationale: { type: String, required: true },
        conflictCheck: {
            status: { type: String, enum: ['conflicting', 'non-conflicting'], required: true },
            details: { type: String, default: null },
        },
        confidence: {
            level: { type: String, enum: ['high', 'medium', 'low'], required: true },
            reachesGoalState: { type: String, enum: ['yes', 'no', 'partially'], required: true },
            reasoning: { type: String, default: null },
        },
    },
    { _id: false }
);

const decisionSchema = new mongoose.Schema(
    {
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        candidateId: { type: String, enum: ['candidate_0', 'candidate_1', 'custom', null], default: null },
        customInstruction: { type: String, default: null },
        comment: { type: String, default: null },
        decidedBy: { type: String, default: null },
        decidedAt: { type: Date, default: null },
        groundTruthVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1GroundTruthVersion', default: null },
        appliedVersionNumber: { type: Number, default: null },
    },
    { _id: false }
);

const targetSchema = new mongoose.Schema(
    {
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1GroundTruthDocument', required: true },
        fileName: { type: String, required: true },
        section: { type: String, default: null },
        candidates: {
            candidate_0: { type: candidateSchema, required: true },
            candidate_1: { type: candidateSchema, required: true },
        },
        decision: { type: decisionSchema, default: () => ({}) },
    },
    { _id: false }
);

const diagnosisSchema = new mongoose.Schema(
    {
        scope: { type: String, enum: ['global', 'specific'], default: null },
        summary: { type: String, default: null },
        targets: { type: [targetSchema], default: [] },
    },
    { _id: false }
);

const eventSchema = new mongoose.Schema(
    {
        type: { type: String, required: true },
        at: { type: Date, default: Date.now },
        meta: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { _id: false }
);

const errorSchema = new mongoose.Schema({ message: { type: String, trim: true } }, { _id: false });

const L1GenericFeedbackRequestSchema = new mongoose.Schema(
    {
        text: { type: String, required: true, trim: true },
        images: { type: [imageSchema], default: [] },
        status: { type: String, enum: L1_GENERIC_FEEDBACK_STATUSES, default: 'processing' },
        diagnosis: { type: diagnosisSchema, default: () => ({}) },
        events: { type: [eventSchema], default: [] },
        errors: { type: [errorSchema], default: [] },
        createdBy: { type: String, trim: true },
    },
    { timestamps: true }
);

L1GenericFeedbackRequestSchema.index({ status: 1, createdAt: -1 });

const L1GenericFeedbackRequestModel = addModel(
    'l1GenericFeedbackRequest',
    L1GenericFeedbackRequestSchema,
    'L1GenericFeedbackRequest'
);

module.exports = L1GenericFeedbackRequestModel;
module.exports.L1_GENERIC_FEEDBACK_STATUSES = L1_GENERIC_FEEDBACK_STATUSES;
