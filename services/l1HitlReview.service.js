const L1SkuTraceModel = require('../models/L1SkuTrace.model');
const L1FeedbackBatchModel = require('../models/L1FeedbackBatch.model');
const Api400Error = require('../errors/api400Error');
const { generate } = require('./llm/llm.service');
const {
    findAngle,
    findVariant,
    findOpenIssue,
    iterVariants,
    nullFeedback,
} = require('../utils/l1TraceLib');
const {
    DEFAULT_CLIENT,
    resolveDocumentForConcernedFile,
    getOrCreateDraftStagingVersion,
    isPreambleConcern,
    parsePreambleType,
} = require('./l1GroundTruth.service');

const EDIT_APPLY_SYSTEM_PROMPT = `You apply one approved editorial fix to a ground-truth guidance document.

Rules:
- Apply EXACTLY the described edit at the described location. Do not rephrase, reorganize, or "clean up" any other part of the document, even if it looks related.
- Preserve the document's existing structure, headings, and formatting outside the edited section.
- Return the ENTIRE document's new full text and nothing else -- no commentary, no markdown code fences, no preamble.`;

const buildEditUserContent = ({ documentContent, location, action, detail, customInstruction }) => {
    if (customInstruction) {
        return JSON.stringify({ documentContent, instruction: customInstruction }, null, 2);
    }
    return JSON.stringify({ documentContent, location, action, detail }, null, 2);
};

const applyEditToDocumentContent = async (documentContent, editSpec) => {
    const userContent = buildEditUserContent({ documentContent, ...editSpec });
    const result = await generate({
        provider: process.env.L1_EDIT_PROVIDER || process.env.L1_RCA_PROVIDER || 'anthropic',
        model: process.env.L1_EDIT_MODEL || process.env.L1_RCA_MODEL || 'claude-sonnet-4-6',
        systemPrompt: EDIT_APPLY_SYSTEM_PROMPT,
        userContent,
        responseFormat: 'text',
    });
    return typeof result === 'string' ? result.trim() : String(result ?? '').trim();
};

const derivePlaceholderOutput = (baseOutput, depth) => {
    if (!baseOutput || !baseOutput.includes('/')) {
        return `${baseOutput ?? ''}/rca_fix_iteration_${depth}/composite_PENDING_RENDER.jpg`;
    }
    const lastSlash = baseOutput.lastIndexOf('/');
    const dirPath = baseOutput.slice(0, lastSlash);
    const filename = baseOutput.slice(lastSlash + 1);
    const parts = filename.split('.');
    let newFilename;
    if (parts.length === 3) {
        parts[1] = 'PENDING_RENDER';
        newFilename = parts.join('.');
    } else {
        const ext = parts.length > 1 ? parts[parts.length - 1] : 'jpg';
        newFilename = `composite_PENDING_RENDER.${ext}`;
    }
    return `${dirPath}/rca_fix_iteration_${depth}/${newFilename}`;
};

const shapeIssue = (skuId, angle, variant, iteration, depth) => {
    const owner =
        depth === 0
            ? variant
            : // walk to the feedback object that owns this iteration, same as generate_review.py
              (() => {
                  let o = variant;
                  for (let d = 0; d < depth; d += 1) {
                      o = o.feedback[`RCA_Iteration_${d}`].approvedFix;
                  }
                  return o;
              })();

    return {
        skuId,
        angleName: angle.angleName,
        clientAngleId: angle.clientAngleId,
        variantIndex: variant.variantIndex,
        depth,
        // The actual faulty render RCA now visually inspects -- surfaced so
        // the human reviewer sees the same evidence the model reasoned over.
        imageUrl: owner.output ?? null,
        feedback: {
            text: owner.feedback.text,
            inferredError: owner.feedback.inferredError,
            inferredFix: owner.feedback.inferredFix,
        },
        concernedFile: iteration.concernedFile,
        concernedLocation: iteration.concernedLocation,
        candidates: iteration.candidates,
    };
};

/** Best-effort event-log append onto the batch this SKU's trace was last
 * touched by -- for the Batch/Session History timeline. Never blocks or
 * fails the decision itself if the batch record is gone (e.g. reset). */
const logBatchEvent = async (batchId, type, meta) => {
    if (!batchId) return;
    try {
        await L1FeedbackBatchModel.updateOne({ _id: batchId }, { $push: { events: { type, meta } } });
    } catch {
        // non-critical -- the decision itself already succeeded/failed independently
    }
};

const listOpenIssues = async ({ skuIds } = {}) => {
    const filter = skuIds?.length ? { _id: { $in: skuIds } } : {};
    const traces = await L1SkuTraceModel.find(filter).lean();

    const issues = [];
    for (const trace of traces) {
        for (const { angle, variant } of iterVariants(trace.data)) {
            const found = findOpenIssue(variant);
            if (!found) continue;
            issues.push(shapeIssue(trace._id, angle, variant, found.iteration, found.depth));
        }
    }
    return issues;
};

const submitDecision = async ({ skuId, clientAngleId, variantIndex, decision, customInstruction, comment }) => {
    const trace = await L1SkuTraceModel.findById(skuId);
    if (!trace) {
        throw new Api400Error(`No trace found for sku=${skuId}`);
    }

    const traceData = trace.data;
    const angle = findAngle(traceData, clientAngleId);
    const variant = findVariant(traceData, clientAngleId, variantIndex);
    const found = findOpenIssue(variant);
    if (!found) {
        throw new Api400Error(
            `variantIndex=${variantIndex} on angle ${clientAngleId} has no open issue awaiting a decision`
        );
    }
    const { iteration, depth } = found;

    iteration.reviewerDecision = decision;
    iteration.reviewerComment = comment ?? null;

    if (decision === 'reject') {
        trace.markModified('data');
        await trace.save();
        await logBatchEvent(trace.lastBatchId, 'issue_decided', { skuId, clientAngleId, variantIndex, depth, decision });
        return { status: 'rejected', skuId, clientAngleId, variantIndex, depth };
    }

    if (decision !== 'candidate_0' && decision !== 'candidate_1' && decision !== 'custom') {
        throw new Api400Error(`Unknown decision: ${decision}`);
    }
    if ((decision === 'candidate_0' || decision === 'candidate_1') && !iteration.candidates?.[decision]) {
        throw new Api400Error(`${decision} not present on this iteration`);
    }
    if (decision === 'custom' && !customInstruction?.trim()) {
        throw new Api400Error('customInstruction is required when decision is "custom"');
    }

    if (isPreambleConcern(iteration.concernedFile)) {
        // No ground-truth document backs a preamble -- record the decision
        // directly on the trace (still closes the issue out of the open
        // queue, same as a resolved content fix) without touching any
        // L1GroundTruthVersion. The suggestion is for an engineer to act on
        // in the rendering pipeline's own code, not something this system
        // can apply itself.
        const preambleType = parsePreambleType(iteration.concernedFile);
        const suggestedChange =
            decision === 'custom' ? customInstruction : iteration.candidates[decision].detail;

        // Same owner-walk as the content-fix path below -- at depth > 0 the
        // relevant "current" output lives on a prior approvedFix, not on
        // the variant itself. No new render happens for a suggestion, so
        // the existing output carries forward unchanged.
        let owner = variant;
        for (let d = 0; d < depth; d += 1) {
            owner = owner.feedback[`RCA_Iteration_${d}`].approvedFix;
        }

        iteration.approvedFix = {
            isPreambleSuggestion: true,
            preambleType,
            candidateId: decision,
            suggestedChange,
            variantIndex,
            prompt: owner.prompt ?? null,
            output: owner.output ?? null,
            image_description: null,
            rework: 'none',
            feedback: nullFeedback(),
        };

        trace.markModified('data');
        await trace.save();
        await logBatchEvent(trace.lastBatchId, 'preamble_suggestion_decided', {
            skuId,
            clientAngleId,
            variantIndex,
            depth,
            preambleType,
            decision,
        });

        return {
            status: 'preambleSuggestionRecorded',
            skuId,
            clientAngleId,
            variantIndex,
            depth,
            preambleType,
            suggestedChange,
        };
    }

    const groundTruthDoc = await resolveDocumentForConcernedFile({
        client: DEFAULT_CLIENT,
        gender: traceData.gender,
        concernedFile: iteration.concernedFile,
        angleName: angle.angleName,
    });

    if (!groundTruthDoc) {
        trace.markModified('data');
        await trace.save();
        await logBatchEvent(trace.lastBatchId, 'issue_needs_manual_handling', { skuId, clientAngleId, variantIndex, depth });
        return {
            status: 'needsManualHandling',
            skuId,
            clientAngleId,
            variantIndex,
            depth,
            reason: `concernedFile "${iteration.concernedFile}" is not an editable ground-truth document`,
        };
    }

    const editSpec =
        decision === 'custom'
            ? { customInstruction }
            : {
                  location: iteration.candidates[decision].location,
                  action: iteration.candidates[decision].action,
                  detail: iteration.candidates[decision].detail,
              };

    const stagingVersion = await getOrCreateDraftStagingVersion(groundTruthDoc);
    const newContent = await applyEditToDocumentContent(stagingVersion.content, editSpec);
    stagingVersion.content = newContent;
    stagingVersion.appliedFixes.push({ source: 'sku', skuId, clientAngleId, variantIndex, depth });
    await stagingVersion.save();

    // Find the owner holding the base `output` this fix supersedes (the
    // variant itself at depth 0, or the previous call's approvedFix).
    let owner = variant;
    for (let d = 0; d < depth; d += 1) {
        owner = owner.feedback[`RCA_Iteration_${d}`].approvedFix;
    }
    const newOutput = derivePlaceholderOutput(owner.output, depth);

    iteration.approvedFix = {
        candidateId: decision,
        variantIndex,
        // The real prompt is normally composed by GTOM's own prompt-writer
        // from the (now-edited) ground-truth doc -- re-implementing that
        // here would be an unvalidated guess, so this is left as an
        // explicit placeholder pending the next real render pass, same
        // convention as `output` below.
        prompt: `<PENDING_PROMPT_REGENERATION — ${groundTruthDoc.fileName} was edited in staging v${stagingVersion.versionNumber}; awaiting next GTOM prompt-composition + render pass>`,
        output: newOutput,
        image_description: null,
        rework: 'none',
        feedback: nullFeedback(),
    };

    trace.markModified('data');
    await trace.save();
    await logBatchEvent(trace.lastBatchId, 'issue_decided', {
        skuId,
        clientAngleId,
        variantIndex,
        depth,
        decision,
        groundTruthDocumentId: groundTruthDoc._id,
        stagingVersionNumber: stagingVersion.versionNumber,
    });

    return {
        status: 'applied',
        skuId,
        clientAngleId,
        variantIndex,
        depth,
        groundTruthDocumentId: groundTruthDoc._id,
        stagingVersionNumber: stagingVersion.versionNumber,
    };
};

module.exports = {
    listOpenIssues,
    submitDecision,
    applyEditToDocumentContent,
};
