const fs = require('fs');
const path = require('path');
const L1SkuTraceModel = require('../models/L1SkuTrace.model');
const L1GenericFeedbackRequestModel = require('../models/L1GenericFeedbackRequest.model');
const { iterVariants, findOpenIssue, ownerAtDepth } = require('../utils/l1TraceLib');
const { getAllLiveContents, DEFAULT_CLIENT, isPreambleConcern, parsePreambleType } = require('./l1GroundTruth.service');
const { generate } = require('./llm/llm.service');
const { fetchImageBuffer } = require('../utils/fetchImageBuffer');

const SOURCE_ROOT = path.resolve(__dirname, '..', 'L1_Feedback_Skill');
const PROMPT_PATH = path.join(SOURCE_ROOT, 'batch_feedback_llm_prompt.md');
const MERGE_CHUNKS_PROMPT_PATH = path.join(SOURCE_ROOT, 'batch_feedback_merge_chunks_llm_prompt.md');

const BATCH_RCA_PROVIDER = process.env.L1_RCA_PROVIDER || 'anthropic';
const BATCH_RCA_MODEL = process.env.L1_RCA_MODEL || 'claude-sonnet-4-6';

// The actual faulty images, not just text, are now sent for clustering (per
// explicit user requirement: "the entire PPT is going to be sent to the
// LLM" -- club issues by what's visually wrong, not only by feedback-text
// similarity). A real production window can span far more images than any
// one vision call should carry (cost + provider limits) -- above this many
// images, the batch is split into chunks, each clustered independently,
// then merged by one final text-only consolidation pass (see
// mergeClusterChunks below) rather than one unbounded vision call.
const MAX_IMAGES_PER_VISION_CALL = Number(process.env.L1_BATCH_RCA_MAX_IMAGES) || 40;

const loadPrompt = () => fs.readFileSync(PROMPT_PATH, 'utf8') + VISION_ADDENDUM;
const loadMergeChunksPrompt = () => fs.readFileSync(MERGE_CHUNKS_PROMPT_PATH, 'utf8');

const VISION_ADDENDUM = `

# Addendum -- vision input now provided

You are now also given the actual faulty rendered image for every issue in
\`issues\`, each preceded by a text label identifying which issue it belongs
to (format: \`IMAGE FOR issues[<index>]: skuId=<id> angleName=<name>
variantIndex=<n>\`), \`<index>\` matching that issue's position in the
\`issues\` array. Use these as real clustering evidence, not just the
per-issue \`feedbackText\`/\`priorDiagnosis\`:

- Cluster by what's actually visually wrong across images, not only by
  matching vocabulary in the feedback text -- two issues whose feedback text
  reads differently can share one root cause visible in both images (e.g.
  both show the same sleeve mis-render even though one reviewer wrote
  "sleeve pushed up" and another wrote "cuff looks off"). The reverse also
  holds: don't merge two issues just because their text sounds similar if
  the images actually show different problems.
- Ground each cluster's \`clusterSummary\` and each candidate's \`rationale\`
  in what you actually see across the cluster's images wherever that's the
  more direct evidence, not only in feedback text.
- If an issue has no image provided (fetch failed -- noted in
  \`imageFetchFailures\` alongside \`groundTruthContent\` if present), cluster
  it using its text fields alone exactly as the base prompt describes; do
  not fabricate what its image might show.`;

/** Every still-open issue across a batch's diagnosed SKUs -- one entry per
 * (skuId, clientAngleId, variantIndex, depth) whose deepest RCA_Iteration
 * has candidates but no approvedFix yet. Includes each issue's rendered
 * image URL so the caller can fetch real vision evidence for clustering
 * (see gatherBatchIssueImages) -- each issue also still carries its own
 * per-SKU LLM diagnosis (priorDiagnosis) as a strong textual signal
 * alongside the image. */
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
                imageUrl: variant.output ?? null,
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

/** Fetches each issue's real rendered image, same fetch pattern as
 * l1Rca.service's gatherVariantImages -- one labeled image per
 * successfully-fetched issue, keyed to its position in `issues` (matching
 * the addendum's `issues[<index>]` labeling), plus a per-issue failure note
 * so the model falls back to text-only for that one instead of assuming no
 * image exists. `imageUrl` is stripped out of the issue objects themselves
 * before they go into the LLM's text payload -- it's not useful as text and
 * would just be noise alongside the actual image. */
const gatherBatchIssueImages = async (issues) => {
    const images = [];
    const imageFetchFailures = [];
    const textIssues = issues.map(({ imageUrl, ...rest }, index) => {
        if (!imageUrl) {
            imageFetchFailures.push({ index, skuId: rest.skuId, reason: 'issue has no output image path' });
        }
        return rest;
    });

    await Promise.all(
        issues.map(async (issue, index) => {
            if (!issue.imageUrl) return;
            try {
                const { buffer, mimeType } = await fetchImageBuffer(issue.imageUrl);
                images.push({
                    buffer,
                    mimeType,
                    label: `IMAGE FOR issues[${index}]: skuId=${issue.skuId} angleName=${issue.angleName} variantIndex=${issue.variantIndex}`,
                    index,
                });
            } catch (err) {
                imageFetchFailures.push({ index, skuId: issue.skuId, reason: err.message });
            }
        })
    );
    images.sort((a, b) => a.index - b.index); // deterministic order, matches issues[] order

    return { textIssues, images, imageFetchFailures };
};

/** One clustering vision call over one chunk's worth of issues/images.
 * Returns the raw, unfiltered `targets[]` the LLM proposed for this chunk
 * -- filtering (needs both candidates, needs a resolvable fileName) happens
 * once, after chunks are merged, in runBatchLevelRca. */
const clusterChunk = async (issues, { images, imageFetchFailures }, groundTruthContent) => {
    const userContent = JSON.stringify(
        {
            issues,
            groundTruthContent,
            ...(imageFetchFailures?.length ? { imageFetchFailures } : {}),
        },
        null,
        2
    );
    const response = await generate({
        provider: BATCH_RCA_PROVIDER,
        model: BATCH_RCA_MODEL,
        systemPrompt: loadPrompt(),
        userContent,
        images,
        responseFormat: 'json',
    });
    return {
        scope: response?.scope === 'global' ? 'global' : 'specific',
        summary: response?.summary ?? null,
        targets: Array.isArray(response?.targets) ? response.targets : [],
    };
};

/** Text-only consolidation pass across multiple chunks' independently-
 * produced targets[] -- only invoked when the batch needed more than one
 * vision call. No images needed here: each chunk's vision reasoning already
 * happened: this step only needs to recognize when two chunks independently
 * named the same real root cause and merge them (union affectedSkuIds, keep
 * the stronger candidates) versus when they're genuinely different issues
 * that happen to target the same file/section. */
const mergeClusterChunks = async (chunkResults, groundTruthContent) => {
    const userContent = JSON.stringify({ chunkResults, groundTruthContent }, null, 2);
    const response = await generate({
        provider: BATCH_RCA_PROVIDER,
        model: BATCH_RCA_MODEL,
        systemPrompt: loadMergeChunksPrompt(),
        userContent,
        responseFormat: 'json',
    });
    return {
        scope: response?.scope === 'global' ? 'global' : 'specific',
        summary: response?.summary ?? null,
        targets: Array.isArray(response?.targets) ? response.targets : [],
    };
};

const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
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
    const issueChunks = chunkArray(issues, MAX_IMAGES_PER_VISION_CALL);

    const chunkResults = await Promise.all(
        issueChunks.map(async (chunk) => {
            const { textIssues, images, imageFetchFailures } = await gatherBatchIssueImages(chunk);
            return clusterChunk(textIssues, { images, imageFetchFailures }, groundTruthContent);
        })
    );

    // A single chunk's result IS the final result -- no need for a second
    // LLM call just to "merge" one thing with itself. Only genuinely
    // multi-chunk batches (real-scale windows) pay for the extra
    // consolidation pass, and it's text-only, not another vision call.
    const { scope, summary, targets: rawTargets } =
        chunkResults.length === 1 ? chunkResults[0] : await mergeClusterChunks(chunkResults, groundTruthContent);

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
