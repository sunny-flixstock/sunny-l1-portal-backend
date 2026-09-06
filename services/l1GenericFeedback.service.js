const fs = require('fs');
const path = require('path');
const L1GenericFeedbackRequestModel = require('../models/L1GenericFeedbackRequest.model');
const L1GroundTruthDocumentModel = require('../models/L1GroundTruthDocument.model');
const Api400Error = require('../errors/api400Error');
const { generate } = require('./llm/llm.service');
const { applyEditToDocumentContent } = require('./l1HitlReview.service');
const { DEFAULT_CLIENT, getAllLiveContents, getOrCreateBatchStagingVersion } = require('./l1GroundTruth.service');

const SOURCE_ROOT = path.resolve(__dirname, '..', '..', 'L1_Feedback_Skill');
const PROMPT_PATH = path.join(SOURCE_ROOT, 'generic_feedback_llm_prompt.md');

// Images are stored as raw bytes in Mongo (see the model) -- no external
// object storage involved. For API responses, render each stored image as
// a data: URI so the frontend can use it directly as an <img>/<Image> src
// with no separate authenticated fetch step.
const withDataUrls = (request) => ({
    ...request,
    images: (request.images || []).map((img) => ({
        mimeType: img.mimeType,
        url: `data:${img.mimeType};base64,${Buffer.from(img.data).toString('base64')}`,
    })),
});

const PROVIDER = process.env.L1_GENERIC_FEEDBACK_PROVIDER || process.env.L1_RCA_PROVIDER || 'anthropic';
const MODEL = process.env.L1_GENERIC_FEEDBACK_MODEL || process.env.L1_RCA_MODEL || 'claude-sonnet-4-6';

let cachedPrompt = null;
const loadPrompt = () => {
    if (cachedPrompt == null) {
        cachedPrompt = fs.readFileSync(PROMPT_PATH, 'utf8');
    }
    return cachedPrompt;
};

const getGenericFeedbackRequestById = async (id) => {
    const request = await L1GenericFeedbackRequestModel.findById(id).lean();
    if (!request) {
        throw new Api400Error(`Generic feedback request not found: ${id}`);
    }
    return withDataUrls(request);
};

/** Runs in the background, same fire-and-poll pattern as
 * l1FeedbackBatch.service's processBatchInBackground -- this call can take
 * minutes (same class of LLM call as per-SKU RCA), so the request record is
 * returned immediately and the caller polls getGenericFeedbackRequestById. */
const runDiagnosis = async (requestId) => {
    const request = await L1GenericFeedbackRequestModel.findById(requestId);
    try {
        const groundTruthContent = await getAllLiveContents(DEFAULT_CLIENT);

        // Already sitting in the document we just loaded -- no external
        // fetch step, so no fetch-failure case to handle here either.
        const images = request.images.map((img, index) => ({
            buffer: img.data,
            mimeType: img.mimeType,
            label: `IMAGE ${index + 1}`,
        }));

        const userContent = JSON.stringify({ feedbackText: request.text, groundTruthContent }, null, 2);

        const response = await generate({
            provider: PROVIDER,
            model: MODEL,
            systemPrompt: loadPrompt(),
            userContent,
            images,
            responseFormat: 'json',
        });

        const scope = response?.scope === 'global' ? 'global' : 'specific';
        const summary = response?.summary ?? null;
        const rawTargets = Array.isArray(response?.targets) ? response.targets : [];

        const targets = [];
        for (const t of rawTargets) {
            const gt = groundTruthContent[t?.fileName];
            if (!gt || !t?.candidates?.candidate_0 || !t?.candidates?.candidate_1) {
                request.errors.push({
                    message: `LLM proposed an unrecognized/incomplete target: ${JSON.stringify(t?.fileName ?? t)}`,
                });
                continue;
            }
            targets.push({
                documentId: gt.documentId,
                fileName: t.fileName,
                section: t.section ?? null,
                candidates: t.candidates,
                decision: { status: 'pending' },
            });
        }

        request.diagnosis = { scope, summary, targets };
        request.status = 'diagnosed';
        request.events.push({ type: 'generic_diagnosed', meta: { scope, targetCount: targets.length } });
    } catch (err) {
        request.status = 'failed';
        request.errors.push({ message: err.message });
        request.events.push({ type: 'generic_diagnosis_failed', meta: { message: err.message } });
    }
    await request.save();
};

/** `images` arrives as [{ data: '<base64>', mimeType }] -- the frontend
 * reads each attached/pasted file as base64 client-side and sends it
 * straight in the request body, no separate upload step. */
const submitGenericFeedback = async ({ text, images, createdBy }) => {
    if (!text || !text.trim()) {
        throw new Api400Error('text is required');
    }
    const storedImages = (images || []).map((img) => ({
        data: Buffer.from(img.data, 'base64'),
        mimeType: img.mimeType,
    }));
    const request = await L1GenericFeedbackRequestModel.create({
        text: text.trim(),
        images: storedImages,
        status: 'processing',
        createdBy,
        events: [{ type: 'generic_feedback_submitted', meta: { imageCount: storedImages.length } }],
    });

    runDiagnosis(request._id).catch(async (err) => {
        await L1GenericFeedbackRequestModel.updateOne(
            { _id: request._id },
            { $set: { status: 'failed' }, $push: { errors: { message: `diagnosis crashed: ${err.message}` } } }
        );
    });

    return getGenericFeedbackRequestById(request._id);
};

const listGenericFeedbackRequests = async () => {
    const requests = await L1GenericFeedbackRequestModel.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
    return requests.map(withDataUrls);
};

/** Same decision/apply mechanics as l1HitlReview.service's submitDecision --
 * reuses applyEditToDocumentContent and getOrCreateBatchStagingVersion so a
 * generic-feedback-approved edit lands in Staging exactly like an
 * SKU-issue-approved one does. `batchId` is passed as null here (this isn't
 * an L1FeedbackBatch run), which is a legitimate value for that helper --
 * every approval simply lands as its own new staging version. */
const submitGenericFeedbackDecision = async ({ requestId, targetIndex, decision, customInstruction, comment, decidedBy }) => {
    const request = await L1GenericFeedbackRequestModel.findById(requestId);
    if (!request) {
        throw new Api400Error(`Generic feedback request not found: ${requestId}`);
    }
    const target = request.diagnosis?.targets?.[targetIndex];
    if (!target) {
        throw new Api400Error(`No target at index ${targetIndex} on request ${requestId}`);
    }
    if (target.decision?.status && target.decision.status !== 'pending') {
        throw new Api400Error(`Target ${targetIndex} already decided (${target.decision.status})`);
    }

    if (decision === 'reject') {
        target.decision = { status: 'rejected', decidedBy, decidedAt: new Date(), comment };
        request.events.push({ type: 'generic_target_decided', meta: { targetIndex, decision } });
        await request.save();
        return { status: 'rejected', requestId, targetIndex };
    }

    if (decision !== 'candidate_0' && decision !== 'candidate_1' && decision !== 'custom') {
        throw new Api400Error(`Unknown decision: ${decision}`);
    }
    if ((decision === 'candidate_0' || decision === 'candidate_1') && !target.candidates?.[decision]) {
        throw new Api400Error(`${decision} not present on this target`);
    }
    if (decision === 'custom' && !customInstruction?.trim()) {
        throw new Api400Error('customInstruction is required when decision is "custom"');
    }

    const groundTruthDoc = await L1GroundTruthDocumentModel.findById(target.documentId);
    if (!groundTruthDoc) {
        throw new Api400Error(`Ground-truth document ${target.documentId} no longer exists`);
    }

    const editSpec =
        decision === 'custom'
            ? { customInstruction }
            : {
                  location: target.candidates[decision].location,
                  action: target.candidates[decision].action,
                  detail: target.candidates[decision].detail,
              };

    const stagingVersion = await getOrCreateBatchStagingVersion(groundTruthDoc, null);
    const newContent = await applyEditToDocumentContent(stagingVersion.content, editSpec);
    stagingVersion.content = newContent;
    stagingVersion.appliedFixes.push({ source: 'generic', genericFeedbackRequestId: request._id, targetIndex });
    await stagingVersion.save();

    target.decision = {
        status: 'approved',
        candidateId: decision,
        customInstruction: decision === 'custom' ? customInstruction : null,
        comment,
        decidedBy,
        decidedAt: new Date(),
        groundTruthVersionId: stagingVersion._id,
        appliedVersionNumber: stagingVersion.versionNumber,
    };
    request.events.push({
        type: 'generic_target_decided',
        meta: {
            targetIndex,
            decision,
            groundTruthDocumentId: groundTruthDoc._id,
            stagingVersionNumber: stagingVersion.versionNumber,
        },
    });
    await request.save();

    return {
        status: 'applied',
        requestId,
        targetIndex,
        groundTruthDocumentId: groundTruthDoc._id,
        stagingVersionNumber: stagingVersion.versionNumber,
    };
};

module.exports = {
    submitGenericFeedback,
    listGenericFeedbackRequests,
    getGenericFeedbackRequestById,
    submitGenericFeedbackDecision,
};
