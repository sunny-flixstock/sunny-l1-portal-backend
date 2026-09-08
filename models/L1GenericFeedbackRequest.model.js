const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

const L1_GENERIC_FEEDBACK_STATUSES = Object.freeze(['processing', 'diagnosed', 'failed']);

// Image bytes are stored directly in Mongo (as BSON binary) rather than in
// external object storage -- this portal has no S3/AWS dependency at all,
// deliberately, so the only persistence layer to run is the one already in
// use for everything else. Fine at this feature's scale (a handful of QC
// screenshots per feedback submission, not a media library).
const imageSchema = new mongoose.Schema(
    {
        data: { type: Buffer, required: true },
        mimeType: { type: String, required: true, trim: true },
        // Optional: which side of a before/after comparison this image is
        // ("the ratio is 7 here, 7.5 there") -- lets diagnosis reason from
        // structured evidence instead of guessing the split from prose.
        // null for an ordinary single-render attachment.
        label: { type: String, enum: ['bad', 'good', null], default: null },
    },
    { _id: false }
);

// Same shape as an L1SkuTrace RCA_Iteration's `candidates` -- deliberately,
// so the HITL approval UI and the edit-apply code path
// (l1HitlReview.service's applyEditToDocumentContent /
// l1GroundTruth.service's getOrCreateDraftStagingVersion) are reused as-is
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
        // Only meaningful for a preamble:* candidate -- preambles are one
        // hardcoded block shared by every client today (unlike
        // styling/posing/angle files, which are already per-client). A
        // preamble edit must say whether it's meant for every client or
        // needs a new per-client conditional, so it's never silently
        // applied everywhere when only one client asked for it. null for a
        // document-target candidate, where this doesn't apply.
        clientScope: { type: String, enum: ['all_clients', 'this_client_only', null], default: null },
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

// One absorbed SKU-level issue -- populated by the reconciliation phase for
// a batch_level target whose cluster covers issues also independently
// diagnosed at the SKU level. Approving the target also closes each of
// these out on its own L1SkuTrace (writes approvedFix there too), so they
// disappear from SKU-Based Issues instead of sitting there stale;
// rejecting the target leaves them open again.
const mergedSkuIssueSchema = new mongoose.Schema(
    {
        skuId: { type: String, required: true },
        clientAngleId: { type: String, required: true },
        variantIndex: { type: Number, required: true },
        depth: { type: Number, required: true },
    },
    { _id: false }
);

const targetSchema = new mongoose.Schema(
    {
        // null for a preamble:* target -- no ground-truth document backs it.
        documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1GroundTruthDocument', default: null },
        fileName: { type: String, required: true },
        section: { type: String, default: null },
        candidates: {
            candidate_0: { type: candidateSchema, required: true },
            candidate_1: { type: candidateSchema, required: true },
        },
        decision: { type: decisionSchema, default: () => ({}) },
        isPreambleSuggestion: { type: Boolean, default: false },
        preambleType: { type: String, default: null },
        // Only populated for a kind:'batch_level' request's targets (see
        // below) -- clusterSummary/affectedSkuIds come straight from the
        // batch-level RCA LLM call; mergedFromSkuIssues is resolved from
        // that by the reconciliation phase into exact issue tuples.
        clusterSummary: { type: String, default: null },
        affectedSkuIds: { type: [String], default: [] },
        mergedFromSkuIssues: { type: [mergedSkuIssueSchema], default: [] },
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
        // The exact, real prompt actually sent to the image model -- present
        // when this feedback came with a full generation bundle (a ZIP
        // upload with metadata.json), not just a bare pasted image. Lets
        // diagnosis compare real prompt text against ground truth directly,
        // the same rigor as the SKU-JSON RCA path.
        realPrompt: { type: String, default: null },
        status: { type: String, enum: L1_GENERIC_FEEDBACK_STATUSES, default: 'processing' },
        // 'manual' = submitted by a human via Submit Feedback (free text,
        // ZIP, or an explicit requirement). 'batch_level' = auto-created by
        // l1BatchRca.service after a batch's per-SKU RCA finishes, clustering
        // issues across many SKUs into the same target/candidate shape so it
        // renders and gets decided on identically in HITL Review.
        kind: { type: String, enum: ['manual', 'batch_level'], default: 'manual' },
        sourceBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1FeedbackBatch', default: null },
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
