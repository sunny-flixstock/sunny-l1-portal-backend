const config = require('../config');
const { getFileFromS3 } = require('./amazonS3Service');

const PHOENIX_BASE_URL = config.PHOENIX_BASE_URL;
const OUTFIT_RENDERING_PROJECT = 'outfit_rendering';
const ARTIFACTS_BUCKET = config.NANOSTUDIO_ARTIFACTS_BUCKET;

// KNOWN GAP, confirmed by reading nanostudio's actual source (not
// guessed): fetchVariantEvidence below can never return a real image URL.
// The outfit_variant_image_generation/output.json artifact this fetches
// only ever holds a path on the pipeline's local, ephemeral run directory
// (nanostudio/src/drivers/outfit_variant_image_generation_driver.py) --
// gati reclaims that directory minutes after the run ends
// (log_shipper.py's own docstring), and this artifact is shipped as-is,
// never rewritten. The real CDN URL is only ever written onto a totally
// separate structure (the final SKU config's
// gtom_L1_output[].selectedOutfits[].variants.data[].output, rewritten by
// gati_adapter.py: publish_results) which this fetch path has no
// reference back to. Until a real way to look up that rewritten URL for a
// given (skuId, clientAngleId, variantIndex, executionId) is found,
// imageUrl is always null for Phoenix-sourced items -- the deck/RCA both
// degrade gracefully for this (a "could not load image" slide, and RCA
// text-only for that variant), so this doesn't block the pipeline, but it
// does mean it can't yet do the vision-based diagnosis it's meant to.

// Every root span (no parent) in outfit_rendering carries a flat
// `nanostudio.rework_type` attribute -- this is the reliable, always-present
// original-vs-rework signal, confirmed present for every client. A separate
// `Rework Run` span (nanostudio.pipeline: "outfit_rework") ALSO exists,
// carrying real reviewer text per angle in its sku_config
// (gtom_L1_output[].reworkFeedback) -- confirmed real and working, but only
// observed for ZLD so far. Checked the actual nanostudio source
// (src/sdk/outfit_review_pipeline.py's ReworkPlan/prepare_rework_plan/
// run_outfit_review_rework) and found NO client-specific branching -- the
// rework-handling code is generic. So the most likely read is simply that
// no BZT Sports SKU has been reworked yet, not that BZT can't produce this.
// fetchReworkRunFeedback below queries for it WITHOUT hardcoding to any one
// client, and is used to upgrade a placeholder to real reviewer text the
// moment real `Rework Run` data exists for BZT too -- no code change needed
// when that happens. `assetAutoUpdate` is deliberately excluded from
// IN_SCOPE_REWORK_TYPES -- system-driven, not QC-driven -- per explicit
// user decision.
const IN_SCOPE_REWORK_TYPES = ['variantRegenerate', 'imageRegenerate', 'assetManualUpdate'];
const REWORK_RUN_SPAN_NAME = 'Rework Run';

const REWORK_TYPE_LABELS = {
    variantRegenerate: 'variant regenerate',
    imageRegenerate: 'image regenerate',
    assetManualUpdate: 'manual prompt update',
};

const isSportsJob = (jobName) => typeof jobName === 'string' && jobName.includes('Sports');

/** One page of the Phoenix spans list endpoint. Never pass an unscoped
 * (no start_time/end_time) client_name-only query here -- confirmed this
 * session that it can return 100+MB pages. */
const fetchSpansPage = async (params) => {
    const url = new URL(`${PHOENIX_BASE_URL}/v1/projects/${OUTFIT_RENDERING_PROJECT}/spans`);
    for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
            value.forEach((v) => url.searchParams.append(key, v));
        } else if (value != null) {
            url.searchParams.append(key, value);
        }
    }
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Phoenix spans request failed: HTTP ${response.status} (${url})`);
    }
    return response.json();
};

/** Every BZT root span (no parent) in outfit_rendering within the window,
 * fully paginated. Filters to Sports jobs client-side -- the Phoenix
 * attribute filter can't substring-match `job_name`, confirmed this
 * session. */
const fetchBztSportsRootSpans = async ({ startTime, endTime }) => {
    const spans = [];
    let cursor;
    do {
        const page = await fetchSpansPage({
            parent_id: 'null',
            attribute: 'nanostudio.client_name:BZT',
            start_time: startTime,
            end_time: endTime,
            limit: 1000,
            cursor,
        });
        spans.push(...page.data);
        cursor = page.next_cursor;
    } while (cursor);

    return spans.filter((s) => isSportsJob(s.attributes?.['nanostudio.job_name']));
};

/** Variant index for a given (execution, angle, composition) comes from
 * the sibling `Vertex Image Studio Image Edit Driver` spans' `step_name`
 * (e.g. ".../variant_2") -- confirmed present on these spans this session,
 * no S3 access needed for this part. */
const resolveVariantIndices = async ({ executionId }) => {
    const page = await fetchSpansPage({
        name: 'Vertex Image Studio Image Edit Driver',
        attribute: [`nanostudio.execution_id:"${executionId}"`],
        limit: 20,
    });
    const indices = new Set();
    for (const span of page.data) {
        const stepName = span.attributes?.['nanostudio.step_name'] || '';
        const match = stepName.match(/variant_(\d+)/);
        if (match) indices.add(Number(match[1]) - 1); // step_name is 1-based, variantIndex is 0-based
    }
    return [...indices].sort((a, b) => a - b);
};

/** The deterministic S3 key pattern confirmed this session from real
 * `output.value` span attributes:
 * nanostudio/logs/sku=<skuId>/outfit_rendering/role=<role>/artifacts/<executionId>/<step>/output.json
 * Constructed directly rather than re-fetched from a span, since the
 * pattern is stable and this avoids an extra Phoenix round-trip per item. */
const artifactKey = ({ skuId, role, executionId, step }) =>
    `nanostudio/logs/sku=${skuId}/outfit_rendering/role=${role}/artifacts/${executionId}/${step}/output.json`;

/** Fetches the outfit_variant_image_generation step's output.json for one
 * execution. Shape CONFIRMED against nanostudio's actual producer,
 * `outfit_variant_image_generation_driver.py` (its own docstring + the
 * exact code that writes it): `{ variants_output: [{ prompt, output }] }`,
 * one entry per variant in array order (no explicit index field -- position
 * IS the variant index). `prompt` is the real final composed prompt text,
 * safe to use as RCA evidence.
 *
 * `output` is NOT safe to use as an image URL, confirmed by reading both
 * this driver and the artifact-shipping path: at the moment this file is
 * written, `output` is a path on the pipeline's *local, ephemeral* run
 * directory (gati reclaims that directory "minutes after" the run ends,
 * per `log_shipper.py`'s own docstring) -- it is never rewritten to a real
 * CDN URL before being archived. The actual CDN rewrite happens
 * separately, in `gati_adapter.py: publish_results`, onto a different
 * structure entirely (`variants.data[].output` on the final SKU config),
 * which this artifact has no reference back to. So: `prompt` from here is
 * trustworthy; `imageUrl` is always returned null until a real source for
 * the rewritten URL is found (see this file's header comment). Defensive
 * on any fetch/parse failure -- logs a warning and returns an empty map
 * rather than throwing, so one SKU's missing artifact never takes down the
 * whole fetch. */
const fetchVariantEvidence = async ({ skuId, role, executionId }) => {
    const key = artifactKey({ skuId, role, executionId, step: 'outfit_variant_image_generation' });
    try {
        const obj = await getFileFromS3({ key, bucketName: ARTIFACTS_BUCKET });
        const parsed = JSON.parse(obj.Body.toString('utf8'));
        const variants = Array.isArray(parsed?.variants_output) ? parsed.variants_output : [];
        const byIndex = new Map();
        variants.forEach((v, i) => {
            byIndex.set(i, { prompt: v.prompt || null, imageUrl: null });
        });
        return byIndex;
    } catch (err) {
        console.log(`WARN: could not fetch/parse artifact ${key}: ${err.message}`);
        return new Map();
    }
};

/** Real reviewer feedback text, keyed by `${skuId}::${clientAngleId}`,
 * sourced from `Rework Run` spans in the window -- see the note above
 * IN_SCOPE_REWORK_TYPES. Queried without hardcoding to any one client, so
 * this starts returning real BZT entries the moment real `Rework Run` data
 * exists for BZT too, with no code change. Empty map (not an error) when
 * none exist yet, which is expected for BZT today. */
const fetchReworkRunFeedback = async ({ startTime, endTime, clientName }) => {
    const feedback = new Map();
    let cursor;
    do {
        const page = await fetchSpansPage({
            name: REWORK_RUN_SPAN_NAME,
            attribute: `nanostudio.client_name:${clientName}`,
            start_time: startTime,
            end_time: endTime,
            limit: 200,
            cursor,
        });
        for (const span of page.data) {
            const skuId = span.attributes?.['nanostudio.sku_id'];
            const rawConfig = span.attributes?.['nanostudio.sku_config'];
            if (!skuId || !rawConfig) continue;
            let parsedConfig;
            try {
                parsedConfig = JSON.parse(rawConfig);
            } catch {
                continue; // malformed sku_config on this span -- skip, don't fail the whole fetch
            }
            for (const angle of parsedConfig.gtom_L1_output || []) {
                const clientAngleId = angle.clientAngleId ?? angle.clientAngle?._id;
                const reworkType = angle.ReworkType;
                const texts = angle.reworkFeedback;
                if (!clientAngleId || !reworkType || reworkType === 'none' || !Array.isArray(texts) || !texts.length) continue;
                feedback.set(`${skuId}::${clientAngleId}`, { text: texts.filter(Boolean).join('; '), reworkType });
            }
        }
        cursor = page.next_cursor;
    } while (cursor);
    return feedback;
};

/** Every BZT Sports (SKU, angle, variant) flagged for rework in the given
 * window, in scope per IN_SCOPE_REWORK_TYPES. Returns items shaped for
 * l1PayloadSession.service's createPayloadSessionFromPhoenix to consume
 * directly. `feedbackText`/`feedbackSource` are a KNOWN GAP: BZT's Phoenix
 * instrumentation carries no reviewer comment text (confirmed exhaustively
 * this session), so feedbackText is synthesized from the rework type label
 * alone, and feedbackSource is tagged 'rework_type_only' so this is visibly
 * distinguishable from real reviewer text ('reviewer_text') downstream. */
const fetchBztSportsReworkItems = async ({ startTime, endTime }) => {
    const [rootSpans, reworkRunFeedback] = await Promise.all([
        fetchBztSportsRootSpans({ startTime, endTime }),
        fetchReworkRunFeedback({ startTime, endTime, clientName: 'BZT' }),
    ]);
    const reworkSpans = rootSpans.filter((s) => IN_SCOPE_REWORK_TYPES.includes(s.attributes?.['nanostudio.rework_type']));

    const items = [];
    for (const span of reworkSpans) {
        const a = span.attributes;
        const skuId = a['nanostudio.sku_id'];
        const executionId = a['nanostudio.execution_id'];
        const clientAngleId = a['nanostudio.angle_type_id'];
        const angleName = a['nanostudio.angle_display'];
        const reworkType = a['nanostudio.rework_type'];
        const role = a['nanostudio.role'];
        const gender = a['nanostudio.gender'] ?? null;

        if (!skuId || !executionId || !clientAngleId) continue; // can't identify this item without these

        const [variantIndices, evidenceByIndex] = await Promise.all([
            resolveVariantIndices({ executionId }),
            fetchVariantEvidence({ skuId, role, executionId }),
        ]);

        // Real reviewer text, when available, always wins over the
        // rework-type-only placeholder -- see fetchReworkRunFeedback.
        const realFeedback = reworkRunFeedback.get(`${skuId}::${clientAngleId}`);

        const indices = variantIndices.length ? variantIndices : [...evidenceByIndex.keys()];
        for (const variantIndex of indices.length ? indices : [0]) {
            const evidence = evidenceByIndex.get(variantIndex) ?? { prompt: null, imageUrl: null };
            items.push({
                skuId,
                gender,
                clientAngleId,
                angleName,
                variantIndex,
                prompt: evidence.prompt,
                imageUrl: evidence.imageUrl,
                reworkType,
                feedbackText: realFeedback?.text || `Flagged for rework: ${REWORK_TYPE_LABELS[reworkType] || reworkType}`,
                feedbackSource: realFeedback?.text ? 'reviewer_text' : 'rework_type_only',
            });
        }
    }
    return items;
};

module.exports = {
    fetchBztSportsReworkItems,
    IN_SCOPE_REWORK_TYPES,
};
