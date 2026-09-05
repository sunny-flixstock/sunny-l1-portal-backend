const fs = require('fs');
const path = require('path');
const L1SkuTraceModel = require('../models/L1SkuTrace.model');
const { generate } = require('./llm/llm.service');
const { findPendingDiagnosis, iterVariants } = require('../utils/l1TraceLib');
const { getLiveContentByDocumentId } = require('./l1GroundTruth.service');
const { fetchImageBuffer } = require('../utils/fetchImageBuffer');

const SOURCE_ROOT = path.resolve(__dirname, '..', '..', 'L1_Feedback_Skill');
const RCA_PROMPT_PATH = path.join(SOURCE_ROOT, 'rca_llm_prompt.md');

const RCA_PROVIDER = process.env.L1_RCA_PROVIDER || 'anthropic';
const RCA_MODEL = process.env.L1_RCA_MODEL || 'claude-sonnet-4-6';

// rca_llm_prompt.md (used verbatim below, per SKILL.md) was written for a
// human/Claude session where the trace JSON is literally the whole input.
// This automated service sends one extra sibling key alongside it --
// `groundTruthContent`, the actual live text of every ground-truth doc the
// trace's stylingMd/posingMd/groundTruthAngleDoc references currently
// point at, keyed by filename -- since the prompt's own "compare the
// prompt against the ground-truth sources" step needs real text, not just
// a filename reference. This addendum is the only deviation from verbatim.
const GROUND_TRUTH_CONTENT_ADDENDUM = `

# Addendum -- ground-truth content

Alongside \`configData\`, the input JSON also has a sibling top-level key
\`groundTruthContent\`, keyed by filename (matching the \`ref\` on
\`groundTruth.stylingMd\`/\`groundTruth.posingMd\`/an angle's
\`groundTruthAngleDoc\`), each holding \`{ versionNumber, content }\` -- the
actual current live text of that file. Use this as the real ground-truth
source text the Task instructs you to compare each variant's \`prompt\`
against. If a reference in the trace has no matching entry in
\`groundTruthContent\` (not yet seeded), say so plainly in that variant's
\`inferredError\` rather than guessing what the file contains.

# Addendum -- exact output nesting for candidate_0 / candidate_1

\`candidate_0\` and \`candidate_1\` are NOT flat siblings of
\`concernedFile\`/\`concernedLocation\`/\`approvedFix\` inside
\`RCA_Iteration_<N>\`. They must be nested one level deeper, inside a
\`candidates\` object, exactly like this:

\`\`\`json
"RCA_Iteration_0": {
  "concernedFile": "...",
  "concernedLocation": "...",
  "candidates": {
    "candidate_0": { "location": "...", "action": "...", "detail": "...", "rationale": "...", "conflictCheck": {"status": "...", "details": "..."}, "confidence": {"level": "...", "reachesGoalState": "...", "reasoning": "..."} },
    "candidate_1": { "...same shape..." }
  },
  "approvedFix": null
}
\`\`\`

Get this nesting exactly right -- everything downstream (the human review
step, applying an approved fix) reads \`RCA_Iteration_<N>.candidates.candidate_0\`,
not \`RCA_Iteration_<N>.candidate_0\`.

# Addendum -- vision input now provided (supersedes the "Assumption" section above)

The base prompt's "Assumption" section above says the image faithfully
matches the prompt and instructs you never to inspect image content --
**that restriction is lifted.** You are now also given the actual faulty
rendered image for every variant needing diagnosis in this call, each
preceded by a text label identifying exactly which variant it belongs to
(format: \`IMAGE FOR clientAngleId=<id> variantIndex=<n>\`). Actually look
at each image before diagnosing that variant:

- Compare what you SEE in the image against what \`feedback.text\` says is
  wrong, and against the variant's own \`prompt\` text and the
  ground-truth content. A mismatch can be purely textual (the prompt says
  something the ground truth forbids) or purely visual (the render shows
  something the prompt text doesn't even mention -- a rendering artifact,
  a pose that doesn't match what was requested, a garment detail rendered
  incorrectly despite correct prompt wording).
- Ground \`inferredError\`/\`inferredFix\` and each candidate's
  \`rationale\` in what you actually observed in the image wherever the
  image is the more direct evidence, not only in the prompt text.
- If a variant needing diagnosis has no image provided (fetch failed --
  noted in \`imageFetchFailures\` alongside \`groundTruthContent\` if
  present), fall back to text-only reasoning for that one variant exactly
  as the base prompt describes, and do not fabricate what the image might
  show.`;

let cachedRcaPrompt = null;
const loadRcaPrompt = () => {
    if (cachedRcaPrompt == null) {
        cachedRcaPrompt = fs.readFileSync(RCA_PROMPT_PATH, 'utf8') + GROUND_TRUTH_CONTENT_ADDENDUM;
    }
    return cachedRcaPrompt;
};

/** Fetch the CURRENT live content of every ground-truth doc this SKU's
 * (already-trimmed) trace actually references -- styling/posing once, plus
 * one angle file per distinct angle still present in gtom_L1_output. Only
 * fetches what's relevant to this SKU, matching the "lower sample size"
 * trimming rule already applied to variants. Missing/unseeded docs are
 * simply omitted rather than failing the whole diagnosis -- the prompt
 * itself already says to note it plainly instead of guessing when a
 * source wasn't provided. */
const gatherGroundTruthContent = async (skuData) => {
    const refs = new Map();
    const addRef = (ref) => {
        if (ref?.groundTruthDocumentId) {
            refs.set(String(ref.groundTruthDocumentId), ref.groundTruthDocumentId);
        }
    };
    addRef(skuData.groundTruth?.stylingMd);
    addRef(skuData.groundTruth?.posingMd);
    for (const angle of skuData.gtom_L1_output || []) {
        addRef(angle.groundTruthAngleDoc);
    }

    const entries = await Promise.all(
        [...refs.values()].map(async (documentId) => {
            const live = await getLiveContentByDocumentId(documentId);
            return live ? [live.fileName, { versionNumber: live.versionNumber, content: live.content }] : null;
        })
    );

    return Object.fromEntries(entries.filter(Boolean));
};

/** Fetch the actual faulty rendered image for every variant that still
 * needs a diagnosis this call -- only those, matching the same "only
 * what's relevant" trimming principle used everywhere else in this
 * pipeline. Returns { images, imageFetchFailures } -- one labeled image
 * per successfully-fetched variant, and a note per variant whose image
 * couldn't be fetched (broken URL, unsupported type, timeout) so the
 * model knows to fall back to text-only reasoning for that one rather
 * than assume no image exists at all. */
const gatherVariantImages = async (skuData) => {
    const images = [];
    const imageFetchFailures = [];

    for (const { angle, variant } of iterVariants(skuData)) {
        if (findPendingDiagnosis(variant) == null) {
            continue; // nothing to diagnose for this variant this call
        }
        if (!variant.output) {
            imageFetchFailures.push({
                clientAngleId: angle.clientAngleId,
                variantIndex: variant.variantIndex,
                reason: 'variant has no output image path',
            });
            continue;
        }
        try {
            const { buffer, mimeType } = await fetchImageBuffer(variant.output);
            images.push({
                buffer,
                mimeType,
                label: `IMAGE FOR clientAngleId=${angle.clientAngleId} variantIndex=${variant.variantIndex}`,
            });
        } catch (err) {
            imageFetchFailures.push({
                clientAngleId: angle.clientAngleId,
                variantIndex: variant.variantIndex,
                reason: err.message,
            });
        }
    }

    return { images, imageFetchFailures };
};

const hasPendingDiagnosis = (traceData) => {
    for (const { variant } of iterVariants(traceData)) {
        if (findPendingDiagnosis(variant) != null) {
            return true;
        }
    }
    return false;
};

/** Run rca_llm_prompt.md verbatim against one SKU's full trace. Returns the
 * updated trace `data` (every variant unchanged except newly populated
 * RCA_Iteration_N blocks), per the prompt's declared output format. */
const diagnoseSku = async (skuId) => {
    const trace = await L1SkuTraceModel.findById(skuId).lean();
    if (!trace) {
        throw new Error(`no trace found for sku=${skuId}`);
    }
    if (!hasPendingDiagnosis(trace.data)) {
        return trace.data;
    }

    const systemPrompt = loadRcaPrompt();
    const groundTruthContent = await gatherGroundTruthContent(trace.data);
    const { images, imageFetchFailures } = await gatherVariantImages(trace.data);
    const userContent = JSON.stringify(
        {
            configData: { [skuId]: trace.data },
            groundTruthContent,
            ...(imageFetchFailures.length ? { imageFetchFailures } : {}),
        },
        null,
        2
    );

    const response = await generate({
        provider: RCA_PROVIDER,
        model: RCA_MODEL,
        systemPrompt,
        userContent,
        images,
        responseFormat: 'json',
    });

    const updatedSkuData = response?.configData?.[skuId];
    if (!updatedSkuData) {
        throw new Error(
            `RCA response for sku=${skuId} did not contain configData.${skuId} -- got keys: ${Object.keys(response?.configData ?? {}).join(', ') || 'none'}`
        );
    }

    await L1SkuTraceModel.updateOne({ _id: skuId }, { $set: { data: updatedSkuData } });
    return updatedSkuData;
};

/** Run diagnosis for every SKU in a batch. Per-SKU resilience: one bad LLM
 * response or malformed reply does not block the rest of the batch. */
const runRcaForBatch = async (skuIds) => {
    const results = [];
    for (const skuId of skuIds) {
        try {
            await diagnoseSku(skuId);
            results.push({ skuId, ok: true });
        } catch (err) {
            results.push({ skuId, ok: false, error: err.message });
        }
    }
    return results;
};

module.exports = {
    diagnoseSku,
    runRcaForBatch,
    hasPendingDiagnosis,
};
