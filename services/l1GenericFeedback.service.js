const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const mime = require('mime-types');
const L1GenericFeedbackRequestModel = require('../models/L1GenericFeedbackRequest.model');
const L1GroundTruthDocumentModel = require('../models/L1GroundTruthDocument.model');
const Api400Error = require('../errors/api400Error');
const { generate } = require('./llm/llm.service');
const { applyEditToDocumentContent } = require('./l1HitlReview.service');
const {
    DEFAULT_CLIENT,
    getAllLiveContents,
    getOrCreateBatchStagingVersion,
    isPreambleConcern,
    parsePreambleType,
} = require('./l1GroundTruth.service');

const SOURCE_ROOT = path.resolve(__dirname, '..', 'L1_Feedback_Skill');
const PROMPT_PATH = path.join(SOURCE_ROOT, 'generic_feedback_llm_prompt.md');

// `.lean()` reads return a Buffer-typed field as the driver's raw BSON
// Binary wrapper (a plain object with a `.buffer` property), not a real
// Buffer -- Buffer.from() on that produces a silent empty buffer rather
// than an error. Handle every shape that can actually reach here.
const toBuffer = (raw) => {
    if (Buffer.isBuffer(raw)) return raw;
    if (raw?.buffer) return Buffer.from(raw.buffer);
    if (Array.isArray(raw?.data)) return Buffer.from(raw.data);
    return Buffer.from(raw ?? []);
};

// Images are stored as raw bytes in Mongo (see the model) -- no external
// object storage involved. For API responses, render each stored image as
// a data: URI so the frontend can use it directly as an <img>/<Image> src
// with no separate authenticated fetch step.
const withDataUrls = (request) => ({
    ...request,
    images: (request.images || []).map((img) => ({
        mimeType: img.mimeType,
        label: img.label ?? null,
        url: `data:${img.mimeType};base64,${toBuffer(img.data).toString('base64')}`,
    })),
});

/** Per-label vision labels ("BAD EXAMPLE 1", "GOOD EXAMPLE 2", plain
 * "IMAGE 1" for an unlabeled attachment) -- indexed within each label
 * group separately, not globally, so "BAD EXAMPLE 2" always means the
 * second bad example specifically. */
const labelImages = (images) => {
    const counters = { bad: 0, good: 0, plain: 0 };
    return images.map((img) => {
        const kind = img.label === 'bad' ? 'BAD EXAMPLE' : img.label === 'good' ? 'GOOD EXAMPLE' : 'IMAGE';
        const counterKey = img.label === 'bad' ? 'bad' : img.label === 'good' ? 'good' : 'plain';
        counters[counterKey] += 1;
        const suffix = counterKey === 'plain' ? ' (the render being diagnosed)' : '';
        return {
            buffer: toBuffer(img.data),
            mimeType: img.mimeType,
            label: `${kind} ${counters[counterKey]}${suffix}`,
        };
    });
};

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

const deleteGenericFeedbackRequest = async (id) => {
    const result = await L1GenericFeedbackRequestModel.deleteOne({ _id: id });
    if (!result.deletedCount) {
        throw new Api400Error(`Generic feedback request not found: ${id}`);
    }
    return { deleted: true, id };
};

/** Runs in the background, same fire-and-poll pattern as
 * l1FeedbackBatch.service's processBatchInBackground -- this call can take
 * minutes (same class of LLM call as per-SKU RCA), so the request record is
 * returned immediately and the caller polls getGenericFeedbackRequestById.
 * `referenceImages` (from a ZIP bundle's references/*.jpg -- identity/garment
 * photos the output was generated from) are passed as a plain in-process
 * argument, never persisted: they're only useful for this one diagnosis
 * call, and several multi-MB references would risk Mongo's 16MB document
 * limit if stored alongside the output image(s). If the process restarts
 * mid-diagnosis they're lost along with the rest of the in-flight call --
 * an existing, already-accepted risk for this fire-and-background pattern,
 * not a new one. */
const runDiagnosis = async (requestId, referenceImages = []) => {
    const request = await L1GenericFeedbackRequestModel.findById(requestId);
    try {
        const groundTruthContent = await getAllLiveContents(DEFAULT_CLIENT);

        // Already sitting in the document we just loaded -- no external
        // fetch step, so no fetch-failure case to handle here either.
        const images = [
            ...labelImages(request.images),
            ...referenceImages.map((img, index) => ({
                buffer: img.buffer,
                mimeType: img.mimeType,
                label: `REFERENCE ${index + 1} (identity/garment reference used to generate the render -- not the render itself)`,
            })),
        ];

        const userContent = JSON.stringify(
            {
                feedbackText: request.text,
                ...(request.realPrompt ? { realPrompt: request.realPrompt } : {}),
                groundTruthContent,
            },
            null,
            2
        );

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
            if (!t?.candidates?.candidate_0 || !t?.candidates?.candidate_1) {
                request.errors.push({
                    message: `LLM proposed a target with incomplete candidates: ${JSON.stringify(t?.fileName ?? t)}`,
                });
                continue;
            }

            if (isPreambleConcern(t.fileName)) {
                targets.push({
                    documentId: null,
                    fileName: t.fileName,
                    section: null,
                    candidates: t.candidates,
                    decision: { status: 'pending' },
                    isPreambleSuggestion: true,
                    preambleType: parsePreambleType(t.fileName),
                });
                continue;
            }

            const gt = groundTruthContent[t?.fileName];
            if (!gt) {
                request.errors.push({
                    message: `LLM proposed an unrecognized target: ${JSON.stringify(t?.fileName ?? t)}`,
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
/** Shared by submitGenericFeedback and submitZipFeedback: create the
 * record, kick off diagnosis in the background (same fire-and-poll pattern
 * as l1FeedbackBatch.service), and return the freshly-created record. */
const createAndDiagnose = async ({ text, storedImages, realPrompt, referenceImages, createdBy, submittedEventType }) => {
    const request = await L1GenericFeedbackRequestModel.create({
        text: text.trim(),
        images: storedImages,
        realPrompt: realPrompt ?? null,
        status: 'processing',
        createdBy,
        events: [
            {
                type: submittedEventType,
                meta: {
                    imageCount: storedImages.length,
                    hasRealPrompt: Boolean(realPrompt),
                    referenceImageCount: referenceImages?.length ?? 0,
                },
            },
        ],
    });

    runDiagnosis(request._id, referenceImages).catch(async (err) => {
        await L1GenericFeedbackRequestModel.updateOne(
            { _id: request._id },
            { $set: { status: 'failed' }, $push: { errors: { message: `diagnosis crashed: ${err.message}` } } }
        );
    });

    return getGenericFeedbackRequestById(request._id);
};

/** `images` arrives as [{ data: '<base64>', mimeType, label? }] -- the
 * frontend reads each attached/pasted file as base64 client-side and sends
 * it straight in the request body, no separate upload step. `label`
 * ('bad'|'good', optional) marks which side of a before/after comparison
 * an image is, when the user is submitting evidence in bulk for both. */
const submitGenericFeedback = async ({ text, images, createdBy }) => {
    if (!text || !text.trim()) {
        throw new Api400Error('text is required');
    }
    const storedImages = (images || []).map((img) => ({
        data: Buffer.from(img.data, 'base64'),
        mimeType: img.mimeType,
        label: img.label === 'bad' || img.label === 'good' ? img.label : null,
    }));
    return createAndDiagnose({ text, storedImages, createdBy, submittedEventType: 'generic_feedback_submitted' });
};

// Bound how many reference images get sent to the vision call, both for
// cost and because a bundle can legitimately carry several multi-MB refs --
// the first few are almost always the identity/hero-garment shots that
// matter most for fidelity comparison.
const MAX_REFERENCE_IMAGES = 4;

/** A generation bundle (e.g. a vertex_*.zip): metadata.json (with the
 * exact, real prompt actually sent to the image model, plus the list of
 * output/reference files) + outputs/*.jpg + references/*.jpg. Output
 * render(s) are persisted (the thing actually being diagnosed) exactly
 * like a pasted image; reference images (identity/garment photos the
 * render was generated from) are used for this one diagnosis call only,
 * never persisted -- see runDiagnosis's referenceImages param. */
const submitZipFeedback = async ({ zipBuffer, text, createdBy }) => {
    if (!text || !text.trim()) {
        throw new Api400Error('text is required');
    }
    if (!zipBuffer || !zipBuffer.length) {
        throw new Api400Error('bundle file is required');
    }

    let zip;
    try {
        zip = new AdmZip(zipBuffer);
    } catch (err) {
        throw new Api400Error(`bundle is not a valid zip file: ${err.message}`);
    }

    const metadataEntry = zip.getEntry('metadata.json');
    if (!metadataEntry) {
        throw new Api400Error('bundle is missing metadata.json');
    }
    let metadata;
    try {
        metadata = JSON.parse(zip.readAsText(metadataEntry));
    } catch (err) {
        throw new Api400Error(`metadata.json is not valid JSON: ${err.message}`);
    }

    const outputFiles = Array.isArray(metadata.outputs) ? metadata.outputs : [];
    if (!outputFiles.length) {
        throw new Api400Error('metadata.json has no entries under "outputs"');
    }

    const storedImages = [];
    for (const output of outputFiles) {
        const entry = zip.getEntry(output.file);
        if (!entry) {
            throw new Api400Error(`bundle is missing the output file referenced in metadata.json: ${output.file}`);
        }
        storedImages.push({
            data: entry.getData(),
            mimeType: mime.lookup(output.file) || 'image/jpeg',
        });
    }

    const referenceFiles = Array.isArray(metadata.references) ? metadata.references : [];
    const referenceImages = [];
    for (const ref of referenceFiles.slice(0, MAX_REFERENCE_IMAGES)) {
        const entry = zip.getEntry(ref.file);
        if (!entry) continue; // best-effort -- a missing reference doesn't block diagnosis
        referenceImages.push({
            buffer: entry.getData(),
            mimeType: mime.lookup(ref.file) || 'image/jpeg',
        });
    }

    return createAndDiagnose({
        text,
        storedImages,
        realPrompt: metadata.prompt ?? null,
        referenceImages,
        createdBy,
        submittedEventType: 'generic_feedback_zip_submitted',
    });
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

    if (target.isPreambleSuggestion) {
        // No ground-truth document backs a preamble -- record the decision,
        // no L1GroundTruthVersion touched. See l1HitlReview.service's
        // equivalent branch for the SKU-based flow.
        const suggestedChange = decision === 'custom' ? customInstruction : target.candidates[decision].detail;
        target.decision = {
            status: 'approved',
            candidateId: decision,
            customInstruction: decision === 'custom' ? customInstruction : null,
            comment,
            decidedBy,
            decidedAt: new Date(),
        };
        request.events.push({
            type: 'generic_preamble_suggestion_decided',
            meta: { targetIndex, decision, preambleType: target.preambleType, suggestedChange },
        });
        await request.save();

        return {
            status: 'preambleSuggestionRecorded',
            requestId,
            targetIndex,
            preambleType: target.preambleType,
            suggestedChange,
        };
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
    submitZipFeedback,
    listGenericFeedbackRequests,
    getGenericFeedbackRequestById,
    deleteGenericFeedbackRequest,
    submitGenericFeedbackDecision,
};
