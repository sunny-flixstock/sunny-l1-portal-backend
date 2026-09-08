const fs = require('fs');
const path = require('path');
const L1SkuTraceModel = require('../models/L1SkuTrace.model');
const L1GenericFeedbackRequestModel = require('../models/L1GenericFeedbackRequest.model');
const { iterVariants, findOpenIssue, ownerAtDepth } = require('../utils/l1TraceLib');
const { getAllLiveContents, DEFAULT_CLIENT, isPreambleConcern, parsePreambleType } = require('./l1GroundTruth.service');
const { generate } = require('./llm/llm.service');

const SOURCE_ROOT = path.resolve(__dirname, '..', 'L1_Feedback_Skill');
const PROMPT_PATH = path.join(SOURCE_ROOT, 'batch_feedback_llm_prompt.md');
const loadPrompt = () => fs.readFileSync(PROMPT_PATH, 'utf8');

const BATCH_RCA_PROVIDER = process.env.L1_RCA_PROVIDER || 'anthropic';
const BATCH_RCA_MODEL = process.env.L1_RCA_MODEL || 'claude-sonnet-4-6';

/** Every still-open issue across a batch's diagnosed SKUs -- one entry per
 * (skuId, clientAngleId, variantIndex, depth) whose deepest RCA_Iteration
 * has candidates but no approvedFix yet. Text-only (no images): a batch
 * can span 100 SKUs, and a vision payload at that scale is both expensive
 * and unnecessary -- clustering is a text-pattern-matching task, and each
 * issue already carries its own per-SKU LLM diagnosis (priorDiagnosis) as
 * a strong signal, not just raw feedback text. */
const collectOpenIssuesForBatch = async (skuIds) => {
    const traces = await L1SkuTraceModel.find({ _id: { $in: skuIds } }).lean();
    const issues = [];
    for (const trace of traces) {
        for (const { angle, variant } of iterVariants(trace.data)) {
            const open = findOpenIssue(variant);
            if (!open) continue;
            const atDepth = ownerAtDepth(variant, open.depth);
            issues.push({
                skuId: trace._id,
                gender: trace.gender,
                clientAngleId: angle.clientAngleId,
                angleName: angle.clientAngle?.name ?? angle.angleName ?? null,
                variantIndex: variant.variantIndex,
                depth: open.depth,
                feedbackText: atDepth.feedback?.text ?? null,
                priorDiagnosis: {
                    concernedFile: open.iteration.concernedFile ?? null,
                    concernedLocation: open.iteration.concernedLocation ?? null,
                    candidates: open.iteration.candidates ?? null,
                },
            });
        }
    }
    return issues;
};

/** One LLM call clustering every open issue across the batch into the
 * handful of real recurring root causes, then records the result as a
 * specially-tagged L1GenericFeedbackRequest -- deliberately reusing that
 * model/HITL surface rather than building a third review UI, since its
 * diagnosis.targets[] shape is already exactly what a cluster needs (see
 * batch_feedback_llm_prompt.md, whose output contract mirrors
 * generic_feedback_llm_prompt.md's on purpose). Each target additionally
 * carries `affectedSkuIds` (which SKUs the LLM attributes to that cluster)
 * for the reconciliation phase to resolve into exact issue tuples. */
const runBatchLevelRca = async (batchId, skuIds) => {
    const issues = await collectOpenIssuesForBatch(skuIds);
    if (!issues.length) {
        return { requestId: null, targetCount: 0 };
    }

    const groundTruthContent = await getAllLiveContents(DEFAULT_CLIENT);
    const userContent = JSON.stringify({ issues, groundTruthContent }, null, 2);

    const response = await generate({
        provider: BATCH_RCA_PROVIDER,
        model: BATCH_RCA_MODEL,
        systemPrompt: loadPrompt(),
        userContent,
        responseFormat: 'json',
    });

    const scope = response?.scope === 'global' ? 'global' : 'specific';
    const summary = response?.summary ?? null;
    const rawTargets = Array.isArray(response?.targets) ? response.targets : [];

    const targets = [];
    for (const t of rawTargets) {
        if (!t?.candidates?.candidate_0 || !t?.candidates?.candidate_1) continue;

        const base = {
            candidates: t.candidates,
            decision: { status: 'pending' },
            clusterSummary: t.clusterSummary ?? null,
            affectedSkuIds: Array.isArray(t.affectedSkuIds) ? t.affectedSkuIds : [],
        };

        if (isPreambleConcern(t.fileName)) {
            targets.push({
                ...base,
                documentId: null,
                fileName: t.fileName,
                section: null,
                isPreambleSuggestion: true,
                preambleType: parsePreambleType(t.fileName),
            });
            continue;
        }

        const gt = groundTruthContent[t?.fileName];
        if (!gt) continue;
        targets.push({ ...base, documentId: gt.documentId, fileName: t.fileName, section: t.section ?? null });
    }

    const request = await L1GenericFeedbackRequestModel.create({
        text: `Batch-level RCA — ${skuIds.length} SKU(s), ${new Date().toISOString().slice(0, 10)}`,
        images: [],
        status: 'diagnosed',
        kind: 'batch_level',
        sourceBatchId: batchId,
        diagnosis: { scope, summary, targets },
        createdBy: 'batch-level-rca',
        events: [{ type: 'batch_level_diagnosed', meta: { scope, targetCount: targets.length, skuCount: skuIds.length } }],
    });

    return { requestId: request._id, targetCount: targets.length };
};

module.exports = {
    collectOpenIssuesForBatch,
    runBatchLevelRca,
};
