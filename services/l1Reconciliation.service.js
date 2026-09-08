const L1GenericFeedbackRequestModel = require('../models/L1GenericFeedbackRequest.model');
const { collectOpenIssuesForBatch } = require('./l1BatchRca.service');
const { resolveDocumentForConcernedFile, DEFAULT_CLIENT } = require('./l1GroundTruth.service');

/** Resolves a batch-level cluster's `affectedSkuIds` (plain SKU id
 * strings, as the clustering LLM named them) into exact SKU-level issue
 * tuples so approving the cluster can also close each one out. Matching is
 * deterministic, not a second LLM call: an open issue counts as absorbed
 * by a target only if (a) its SKU is in that target's `affectedSkuIds` AND
 * (b) its own `concernedFile` resolves to the SAME ground-truth document
 * as the target's `documentId` -- reusing resolveDocumentForConcernedFile
 * (the same resolution `submitDecision` itself uses) rather than a fuzzy
 * string match, since two clusters can legitimately name the same SKU for
 * different files. Preamble targets are skipped -- there's no documentId
 * to match against, and a preamble suggestion never closes out a SKU issue
 * on its own (it's recorded as its own decision, see l1HitlReview's
 * preamble branch). */
const reconcileBatchDiagnoses = async (batchId) => {
    const request = await L1GenericFeedbackRequestModel.findOne({
        sourceBatchId: batchId,
        kind: 'batch_level',
        status: 'diagnosed',
    });
    if (!request) {
        return { mergedCount: 0 };
    }

    const documentTargets = (request.diagnosis?.targets ?? []).filter(
        (t) => !t.isPreambleSuggestion && t.affectedSkuIds?.length
    );
    if (!documentTargets.length) {
        return { mergedCount: 0 };
    }

    const allAffectedSkuIds = [...new Set(documentTargets.flatMap((t) => t.affectedSkuIds))];
    const issues = await collectOpenIssuesForBatch(allAffectedSkuIds);

    // Resolve each open issue's own concernedFile to a documentId once, up
    // front, rather than re-resolving it per target.
    const issueDocumentIds = new Map();
    for (const issue of issues) {
        const doc = await resolveDocumentForConcernedFile({
            client: DEFAULT_CLIENT,
            gender: issue.gender,
            concernedFile: issue.priorDiagnosis.concernedFile,
            angleName: issue.angleName,
        });
        issueDocumentIds.set(issue, doc?._id ? String(doc._id) : null);
    }

    let mergedCount = 0;
    for (const target of documentTargets) {
        const affectedSet = new Set(target.affectedSkuIds);
        const targetDocumentId = String(target.documentId ?? '');
        const merged = issues
            .filter((issue) => affectedSet.has(issue.skuId) && issueDocumentIds.get(issue) === targetDocumentId)
            .map((issue) => ({
                skuId: issue.skuId,
                clientAngleId: issue.clientAngleId,
                variantIndex: issue.variantIndex,
                depth: issue.depth,
            }));
        target.mergedFromSkuIssues = merged;
        mergedCount += merged.length;
    }

    await request.save();
    return { mergedCount };
};

module.exports = {
    reconcileBatchDiagnoses,
};
