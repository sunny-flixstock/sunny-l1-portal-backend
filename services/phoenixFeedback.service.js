const config = require('../config');

const TELEMETRY_BASE_URL = config.NANOSTUDIO_TELEMETRY_API_URL;
const TELEMETRY_API_KEY = config.NANOSTUDIO_TELEMETRY_API_KEY;

// `assetAutoUpdate` is system-driven, not QC-driven -- excluded per
// explicit user decision (unchanged from the old Phoenix-based fetch).
// Confirmed against real data this session: the API's own `has_feedback`
// filter does NOT already exclude it (assetAutoUpdate rows can carry real
// qc_feedback text too), so this still needs to be filtered explicitly --
// done server-side via `rework_type_ne`. Every other rework_type
// (variantRegenerate, imageRegenerate, assetManualUpdate, manualPrompt,
// heroReplace, and whatever gets added later) is QC-driven and in scope --
// an allowlist would silently miss new types the way the old
// IN_SCOPE_REWORK_TYPES list already had (manualPrompt/heroReplace showed
// up in real data this session with no code change expecting them).
const EXCLUDED_REWORK_TYPE = 'assetAutoUpdate';

// Full field list this endpoint actually returns, confirmed live against
// http://<telemetry-host>/v1/feedback-pairs (the API rejects an unknown
// `select` field by naming every valid one in the 400 body -- this list
// was read directly off that response, not guessed). Selected explicitly
// rather than relying on default_select so a future default-set change on
// the server can't silently drop a field this code depends on.
const SELECT_FIELDS = [
    'sku_id', 'sku_name', 'angle', 'angle_instance', 'outfit_index', 'variant_index',
    'prompt', 'image_urls', 'qc_feedback', 'rework_type', 'verdict', 'trace_id',
].join(',');

const telemetryRequest = async (path, params) => {
    if (!TELEMETRY_API_KEY) {
        throw new Error('NANOSTUDIO_TELEMETRY_API_KEY is not set -- required to query the NanoStudio Telemetry API');
    }
    const url = new URL(`${TELEMETRY_BASE_URL}${path}`);
    for (const [key, value] of Object.entries(params)) {
        if (value != null) url.searchParams.set(key, value);
    }
    const response = await fetch(url, { headers: { 'X-API-Key': TELEMETRY_API_KEY } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`Telemetry API request failed: HTTP ${response.status} (${body.error || body.detail || url})`);
    }
    return body;
};

/** Every feedback-pairs row for BZT Sports in the window, fully paginated
 * via the API's own keyset cursor. Filters server-side to what's cheap to
 * push down (client, job name, has_feedback, verdict=current so a
 * superseded slot's stale feedback is never re-surfaced, rework_type !=
 * the excluded system-driven type); `variant_index` and a genuine
 * `rework_type` are checked client-side below since neither is
 * server-filterable as "not null". */
const fetchFeedbackPairsPage = async ({ startTime, endTime, cursor }) =>
    telemetryRequest('/v1/feedback-pairs', {
        client: 'BZT',
        job_name_contains: 'Sports',
        has_feedback: true,
        verdict: 'current',
        rework_type_ne: EXCLUDED_REWORK_TYPE,
        from: startTime,
        to: endTime,
        limit: 1000,
        cursor,
        select: SELECT_FIELDS,
    });

/** angle_instance is `<clientAngleId>_<n>` where `n` is NOT outfit_index
 * (confirmed live: a real row had outfit_index=0 but angle_instance suffix
 * "_2" -- caught by testing against real data rather than one coincidental
 * example where the two happened to match). What IS confirmed, against
 * two different known-good real clientAngleId values this session
 * (BZT_FULL_FRONT_SPORTS's 6a5e2dc478005a8928ef99dc,
 * BZT_FULL_BACK_SPORTS's 6a5e2a9378005a8928ef8803): the part before the
 * LAST underscore is always the real clientAngleId, whatever `n` means --
 * safe because a Mongo ObjectId is exactly 24 hex characters and can never
 * itself contain an underscore. `/v1/feedback-pairs` has no
 * `angle_type_id` field to fetch this more directly (confirmed against
 * the API's own field list -- only `/v1/spans` exposes it). */
const clientAngleIdFromInstance = (angleInstance) => {
    if (!angleInstance) return null;
    const lastUnderscore = angleInstance.lastIndexOf('_');
    return lastUnderscore === -1 ? angleInstance : angleInstance.slice(0, lastUnderscore);
};

/** The composed prompt's very first lines are always the hardcoded gender
 * preamble ("MODEL GENDER — the model is an adult MALE/FEMALE fashion
 * model..." -- confirmed present verbatim on every real prompt this
 * session, both fetched from this API and from manually-uploaded configs
 * earlier this session). Nothing in the feedback-pairs schema carries
 * gender as its own field, so this is the one reliable place to recover
 * it -- needed downstream to resolve the right gendered ground-truth docs
 * (BZT_{Male,Female}_Sports_{Styling,Posing}_PROD.md). Null (not a guess)
 * if the preamble wording ever changes. */
const extractGenderFromPrompt = (prompt) => {
    const match = /adult (male|female) fashion model/i.exec(prompt || '');
    return match ? match[1].toLowerCase() : null;
};

/** Every BZT Sports (SKU, angle, variant) with real, current QC feedback
 * in the window, shaped for l1PayloadSession.service's
 * createPayloadSessionFromPhoenix to consume directly. `skuId` is the
 * real Mongo id (the API's own `sku_id`) -- the same stable identity
 * `unwrapUploadedConfig` resolves for manually-uploaded configs elsewhere
 * in this app, kept consistent here so RCA/HITL trace continuity works
 * the same way regardless of which path a SKU came in through.
 * `feedbackText`/`feedbackSource` are always real now (`qc_feedback` from
 * a real QC rework event) -- the old 'rework_type_only' placeholder this
 * function used to fall back to no longer applies; this API never returns
 * `has_feedback=true` without real text. */
const fetchBztSportsReworkItems = async ({ startTime, endTime }) => {
    const items = [];
    let cursor;
    do {
        const page = await fetchFeedbackPairsPage({ startTime, endTime, cursor });
        for (const row of page.data) {
            // Neither check is expressible as a server-side filter (see
            // fetchFeedbackPairsPage's comment) -- variant_index null rows
            // are the coarser parent span covering every variant an
            // execution touched (confirmed live: always redundant with
            // per-variant sibling rows, never the only record of a real
            // event), and a null rework_type is a non-rework QC marking,
            // not something this pipeline is about.
            if (row.variant_index == null || !row.rework_type) continue;
            if (!row.sku_id || !row.image_urls?.length) continue; // can't identify/display this item without these

            items.push({
                skuId: row.sku_id,
                skuName: row.sku_name,
                gender: extractGenderFromPrompt(row.prompt),
                clientAngleId: clientAngleIdFromInstance(row.angle_instance),
                angleName: row.angle,
                variantIndex: row.variant_index,
                prompt: row.prompt || null,
                imageUrl: row.image_urls[0],
                reworkType: row.rework_type,
                feedbackText: row.qc_feedback,
                feedbackSource: 'qc_rework',
            });
        }
        cursor = page.next_cursor;
    } while (cursor);
    return items;
};

module.exports = {
    fetchBztSportsReworkItems,
};
