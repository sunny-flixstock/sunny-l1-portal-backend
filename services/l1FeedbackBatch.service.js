const L1FeedbackBatchModel = require('../models/L1FeedbackBatch.model');
const L1SkuTraceModel = require('../models/L1SkuTrace.model');
const L1GroundTruthVersionModel = require('../models/L1GroundTruthVersion.model');
const Api400Error = require('../errors/api400Error');
const {
    nullFeedback,
    findAngle,
    setRejectFeedback,
    pruneUntouchedVariants,
} = require('../utils/l1TraceLib');
const { buildDefaultGenderPreamble } = require('../utils/genderPreamble');
const {
    DEFAULT_CLIENT,
    resolveLiveReference,
    resolveLiveAngleReference,
} = require('./l1GroundTruth.service');
const { diagnoseSku } = require('./l1Rca.service');
const { runBatchLevelRca } = require('./l1BatchRca.service');
const { reconcileBatchDiagnoses } = require('./l1Reconciliation.service');

/** Real uploaded SKU configs follow rca_generic_schema.json's top-level
 * shape: { configData: { "<realParentSkuId>": { gender, gtom_L1_output,
 * ... } } } -- one level deeper than the raw SKU object itself, and the
 * real internal id inside `configData` is NOT guaranteed to match the
 * uploaded file's name (confirmed against the real worked examples: e.g.
 * `190375736090.rca_populated.json`'s configData key is actually
 * `6a8d82bfa7b0e101089f35f7`). So the filename is only ever a label for
 * "which file this was" -- the authoritative parentSkuId, used as this
 * SKU's identity everywhere downstream (trace _id, carry-forward lookups,
 * HITL issue lists), is always the real key inside `configData`. A file
 * with no `configData` wrapper is treated as already being the inner
 * shape directly, keyed by its filename, for backward compatibility with
 * simpler test payloads. */
const unwrapUploadedConfig = (fileSkuId, rawConfig) => {
    if (rawConfig && typeof rawConfig === 'object' && rawConfig.configData && typeof rawConfig.configData === 'object') {
        const keys = Object.keys(rawConfig.configData);
        if (keys.length === 1) {
            return { realSkuId: keys[0], config: rawConfig.configData[keys[0]] };
        }
        if (rawConfig.configData[fileSkuId]) {
            return { realSkuId: fileSkuId, config: rawConfig.configData[fileSkuId] };
        }
        throw new Error(
            `uploaded file "${fileSkuId}.json" has a configData wrapper with ${keys.length} keys (${keys.join(', ')}) and none match the filename -- expected exactly one SKU per file`
        );
    }
    return { realSkuId: fileSkuId, config: rawConfig };
};

/** Real uploaded configs nest much deeper than rca_generic_schema.json's
 * illustrative shape, and carry full raw product/asset records everywhere
 * an item is referenced (confirmed against 5 real files in
 * test_l1_feedback_skus/feedback_incorporated/):
 *   - an angle's variants live at
 *     `gtom_L1_output[i].selectedOutfits[j].variants.data[]` (an array,
 *     variantIndex = its position), not a flat `variants[]` on the angle.
 *   - the angle's display name lives at `clientAngle.name`, not a top-level
 *     `angleName`.
 *   - gender lives per-outfit (`selectedOutfits[j].gender`), not once on
 *     the SKU.
 *   - `assets_selected`/`combination_set` entries carry a full nested
 *     product record under `assets` (sometimes an object, sometimes an
 *     array of one) -- images, thumbnails, a 50+-field patternDict, the
 *     works -- when all RCA/HITL ever needs is category/sku/name/color.
 * Everything below normalizes the real shape down to the clean internal
 * shape the rest of this pipeline (l1TraceLib, l1Rca.service,
 * l1HitlReview.service) already assumes, so none of that code needs to
 * know the real shape exists. This is the ONLY layer that should ever
 * touch the raw upload's real structure. */

const firstAsset = (assets) => (Array.isArray(assets) ? assets[0] : assets);

const trimAssetEntry = (entry) => {
    const asset = firstAsset(entry?.assets);
    return {
        category: entry?.category ?? null,
        sku_id: asset?.barcode ?? entry?.sku_id ?? null,
        item_display_name: asset?.patternDict?.['Item Display Name'] ?? asset?.name ?? entry?.item_display_name ?? null,
        item_color: asset?.patternDict?.['Item Color Name'] ?? entry?.item_color ?? null,
    };
};

const trimAssetsSelected = (list) => (list || []).map(trimAssetEntry);

/** outfit_assembly_output.male/female[] and updatedOutfitSelction.
 * selectedOutfits[] entries share this same real shape -- trim their
 * combination_set to just the fields worth an LLM's attention; drop
 * anything not in the original schema (e.g. selectedAnglePresets,
 * ~30KB of angle-preset management metadata with no diagnostic value). */
const trimBlueprintEntry = (entry) =>
    entry && {
        id: entry.id,
        gender: entry.gender,
        composition_id: entry.composition_id,
        blueprint_summary: entry.blueprint_summary,
        missing_categories: entry.missing_categories,
        overall_rationale: entry.overall_rationale,
        coherence_score: entry.coherence_score,
        combination_set: trimAssetsSelected(entry.combination_set),
        rank: entry.rank,
    };

const trimOutfitAssemblyOutput = (raw) =>
    raw && {
        sequence: raw.sequence,
        male: (raw.male || []).map(trimBlueprintEntry),
        female: (raw.female || []).map(trimBlueprintEntry),
    };

const trimUpdatedOutfitSelction = (raw) =>
    raw && {
        sequence: raw.sequence,
        selectedOutfits: (raw.selectedOutfits || []).map(trimBlueprintEntry),
    };

/** First gender found on any outfit in the SKU -- there's no single
 * top-level gender field in the real data. */
const extractGender = (config) => {
    for (const angle of config.gtom_L1_output || []) {
        for (const outfit of angle.selectedOutfits || []) {
            if (outfit.gender) return outfit.gender;
        }
    }
    return config.gender ?? null;
};

/** The real uploaded shape nests variants under
 * `rawAngle.selectedOutfits[].variants(.data)`; the simpler shape used by
 * this project's own .http examples (and any hand-built test payload) puts
 * `variants` directly on the angle, with no `selectedOutfits` wrapper at
 * all. Returns the list of "outfit-like" containers to check for variants
 * on, covering both without either caller needing to know which shape it
 * got -- for the flat shape, the angle itself doubles as its own one
 * implicit outfit, since assets_selected/selectedModel already live
 * directly on it in that shape too. */
const outfitsForAngle = (rawAngle) => (rawAngle.selectedOutfits?.length ? rawAngle.selectedOutfits : [rawAngle]);

const variantsForOutfit = (outfit) =>
    Array.isArray(outfit.variants?.data) ? outfit.variants.data : Array.isArray(outfit.variants) ? outfit.variants : [];

/** Every variant in a raw SKU config where feedback.text is already
 * populated -- the flagged set this upload contributes. Walks both the
 * real nested shape and the simpler flat shape (see outfitsForAngle) but
 * returns { angle, variant, feedbackText } already normalized to the clean
 * internal shape (angleName/clientAngleId flat, variantIndex explicit,
 * assets_selected trimmed) that the rest of the pipeline expects. */
const collectFlaggedIssues = (config) => {
    const issues = [];
    for (const rawAngle of config.gtom_L1_output || []) {
        const angleName = rawAngle.clientAngle?.name ?? rawAngle.angleName ?? null;
        const clientAngleId = rawAngle.clientAngleId ?? rawAngle.clientAngle?._id ?? null;

        for (const outfit of outfitsForAngle(rawAngle)) {
            const variantList = variantsForOutfit(outfit);

            variantList.forEach((rawVariant, variantIndex) => {
                const text = rawVariant.feedback?.text;
                if (text == null || String(text).trim() === '') {
                    return;
                }
                const angle = {
                    clientAngleId,
                    angleName,
                    clientAngle: rawAngle.clientAngle ?? null,
                    identityPreamble: rawAngle.identityPreamble ?? null,
                    selectedModel: rawAngle.selectedModel ?? outfit.selectedModel ?? null,
                    assets_selected: trimAssetsSelected(outfit.assets_selected),
                };
                const variant = {
                    variantIndex,
                    prompt: rawVariant.prompt,
                    output: rawVariant.output,
                    image_description: rawVariant.image_description ?? null,
                };
                issues.push({ angle, variant, feedbackText: text });
            });
        }
    }
    return issues;
};

/** Injects feedback the caller gave separately from the config (not
 * already embedded in a variant's own feedback.text), by exact
 * (clientAngleId, variantIndex) the caller names -- no inference. Mutates
 * the raw config's actual variant object in place (same real/simple-shape
 * traversal as collectFlaggedIssues, so both nested-real-shape and
 * flat-test-shape configs work identically), so the ordinary
 * collectFlaggedIssues pass below picks it up exactly like feedback that
 * was already in the uploaded file. Throws if a named
 * (clientAngleId, variantIndex) doesn't exist in this config -- silently
 * dropping a caller-specified target would be worse than failing loudly. */
const applyExplicitFeedback = (config, feedbackEntries) => {
    for (const { clientAngleId, variantIndex, feedbackText } of feedbackEntries) {
        let found = false;
        for (const rawAngle of config.gtom_L1_output || []) {
            const angleId = rawAngle.clientAngleId ?? rawAngle.clientAngle?._id;
            if (String(angleId) !== String(clientAngleId)) continue;

            for (const outfit of outfitsForAngle(rawAngle)) {
                const variantList = variantsForOutfit(outfit);
                const rawVariant = variantList[variantIndex];
                if (!rawVariant) continue;

                rawVariant.feedback = rawVariant.feedback || {};
                rawVariant.feedback.text = feedbackText;
                found = true;
            }
        }
        if (!found) {
            throw new Error(
                `feedbackEntries names clientAngleId=${clientAngleId} variantIndex=${variantIndex}, which doesn't exist in this config`
            );
        }
    }
    return config;
};

/** Every (clientAngleId, angleName) pair actually present in a raw config
 * -- used by the Payload Creation flow, which only has a human-readable
 * angle label from a feedback doc/PPT, never the real clientAngleId, and
 * needs to resolve one to the other before it can call
 * applyExplicitFeedback (which requires the id, not the name, since a name
 * alone isn't a reliable enough key for a mutation). */
const listAnglesForConfig = (config) =>
    (config.gtom_L1_output || []).map((rawAngle) => ({
        clientAngleId: rawAngle.clientAngleId ?? rawAngle.clientAngle?._id ?? null,
        angleName: rawAngle.clientAngle?.name ?? rawAngle.angleName ?? null,
    }));

/** Uppercase and collapse every run of non-alphanumeric characters to a
 * single underscore, so "Full Front", "full-front", and
 * "BZT_FULL_FRONT_SPORTS" all normalize to a comparable form -- a doc
 * writes angle labels with spaces/hyphens, real angle names use
 * underscores, and this is the one place both need to agree. */
const normalizeAngleLabel = (label) =>
    String(label ?? '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

/** Word SET (not sequence) behind a normalized angle label -- confirmed
 * necessary, not theoretical: this client's real angle names read
 * "FRONT_UPPER_CROP" / "FRONT_LOWER_CROP" (FRONT first), but QC's own
 * documented feedback-doc convention writes "Upper Front Crop" / "Lower
 * Front Crop" (the adjective first) -- a plain substring/exact match on
 * the normalized string misses this real phrasing entirely, silently. */
const angleLabelTokens = (label) => new Set(normalizeAngleLabel(label).split('_').filter(Boolean));

/** Case-insensitive, separator- and word-order-tolerant match of a
 * human-typed angle label (from a feedback doc/PPT) against this config's
 * real angles: matches when one side's word set is fully contained in the
 * other's (the real angle name carries extra client/category tokens like
 * "BZT"/"SPORTS" the human label omits; the human label is never expected
 * to carry extra tokens the real name lacks). Returns null (not a guess)
 * if nothing or more than one angle plausibly matches, since a wrong
 * silent match would apply feedback to the wrong angle. */
const findClientAngleIdByName = (config, angleNameGuess) => {
    const needleTokens = angleLabelTokens(angleNameGuess);
    if (!needleTokens.size) return null;

    const isSubset = (a, b) => [...a].every((t) => b.has(t));

    const angles = listAnglesForConfig(config)
        .filter((a) => a.clientAngleId && a.angleName)
        .map((a) => ({ ...a, tokens: angleLabelTokens(a.angleName) }));

    const matches = angles.filter(
        (a) => isSubset(needleTokens, a.tokens) || isSubset(a.tokens, needleTokens)
    );
    return matches.length === 1 ? matches[0].clientAngleId : null;
};

const pickAngleMeta = (angle) => {
    const { variants, ...meta } = angle;
    return meta;
};

const pickVariantIdentity = (variant) => ({
    variantIndex: variant.variantIndex,
    prompt: variant.prompt,
    output: variant.output,
    image_description: variant.image_description ?? null,
});

/** Ensure the angle+variant sub-tree exists in traceData (inserting it,
 * fresh and with null feedback, if this is the first time it's ever been
 * touched), then route the new feedback text through the correct nested
 * slot via setRejectFeedback -- the same code path whether this is a
 * brand-new SKU or new feedback landing on an existing trace.
 *
 * When an angle is inserted for the first time, its ground-truth angle
 * reference is resolved fresh against our own L1GroundTruthDocument store
 * (by angle name) rather than trusted from the raw upload -- same
 * authoritative-source rule as groundTruth.stylingMd/posingMd below. Left
 * null if that angle isn't one of ours / hasn't been seeded yet. */
const ensureVariantAndApplyFeedback = async (traceData, rawAngle, rawVariant, feedbackText) => {
    traceData.gtom_L1_output = traceData.gtom_L1_output || [];
    let angle = findAngle(traceData, rawAngle.clientAngleId);
    if (!angle) {
        const groundTruthAngleDoc = await resolveLiveAngleReference({
            client: DEFAULT_CLIENT,
            angleName: rawAngle.angleName,
        });
        angle = { ...pickAngleMeta(rawAngle), groundTruthAngleDoc, variants: [] };
        traceData.gtom_L1_output.push(angle);
    }

    let variant = (angle.variants || []).find((v) => v.variantIndex === rawVariant.variantIndex);
    if (!variant) {
        variant = {
            ...pickVariantIdentity(rawVariant),
            rework: 'none',
            feedback: nullFeedback(),
        };
        angle.variants.push(variant);
    }

    setRejectFeedback(variant, feedbackText);
};

/** Resolve groundTruth.stylingMd/posingMd fresh against our own store for
 * this SKU's gender, instead of trusting whatever the raw upload claims --
 * that's the whole point of this being the authoritative source going
 * forward. Falls back to the raw config's own value only if the document
 * hasn't been seeded yet (so ingestion never hard-fails on a missing
 * ground-truth row), and to null if there's nothing to fall back to. */
const resolveGroundTruth = async (gender, rawGroundTruth) => {
    const [stylingMd, posingMd] = await Promise.all([
        resolveLiveReference({ client: DEFAULT_CLIENT, gender, docKey: 'styling' }),
        resolveLiveReference({ client: DEFAULT_CLIENT, gender, docKey: 'posing' }),
    ]);
    return {
        stylingMd: stylingMd ?? rawGroundTruth?.stylingMd ?? null,
        posingMd: posingMd ?? rawGroundTruth?.posingMd ?? null,
    };
};

const buildOrMergeTrace = async (existingData, config, flaggedIssues) => {
    const gender = extractGender(config);
    const traceData =
        existingData ??
        {
            gender,
            // Keep the raw config's genderPreamble if it provided one --
            // it's SKU-specific text, not something we should override.
            // Only fall back to the standard template when it's missing,
            // and never fabricate anything for an unrecognized gender.
            genderPreamble: config.genderPreamble?.text
                ? config.genderPreamble
                : buildDefaultGenderPreamble(gender),
            groundTruth: await resolveGroundTruth(gender, config.groundTruth),
            outfit_assembly_output: trimOutfitAssemblyOutput(config.outfit_assembly_output),
            updatedOutfitSelction: trimUpdatedOutfitSelction(config.updatedOutfitSelction),
            gtom_L1_output: [],
        };

    for (const { angle, variant, feedbackText } of flaggedIssues) {
        await ensureVariantAndApplyFeedback(traceData, angle, variant, feedbackText);
    }

    pruneUntouchedVariants(traceData);
    return traceData;
};

/** Gate: a SKU only gets ingested/traced/diagnosed at all if at least one
 * variant actually carries feedback. Everything else is a deliberate,
 * expected rejection -- distinct from a real processing error -- and never
 * touches L1SkuTrace or the RCA/edit LLM calls. */
const ingestOneSku = async (skuId, config, batchId) => {
    const flaggedIssues = collectFlaggedIssues(config);
    if (!flaggedIssues.length) {
        return { status: 'rejected', reason: 'no variant in this config has feedback.text -- nothing to process' };
    }

    const existing = await L1SkuTraceModel.findById(skuId).lean();
    const mergedData = await buildOrMergeTrace(existing?.data ?? null, config, flaggedIssues);

    await L1SkuTraceModel.findByIdAndUpdate(
        skuId,
        {
            _id: skuId,
            gender: mergedData.gender,
            data: mergedData,
            lastBatchId: batchId,
        },
        { upsert: true, new: true }
    );

    return { status: 'touched' };
};

/** Runs in the background (not awaited by the request) so the caller gets
 * the batch id back immediately and can poll for live progress instead of
 * holding one HTTP connection open for the whole batch's duration -- both
 * because that's a bad UX for a multi-minute job and because it's a real
 * reliability risk (proxies/load balancers commonly kill idle connections
 * well under that). Every SKU's outcome is saved to the batch the moment
 * it happens, not batched up for one write at the end. */
const processBatchInBackground = async (batchId, configs) => {
    const batch = await L1FeedbackBatchModel.findById(batchId);

    batch.currentPhase = 'ingesting';
    await batch.save();

    for (const { skuId: fileSkuId, config: rawConfig, feedbackEntries } of configs) {
        try {
            const { realSkuId, config } = unwrapUploadedConfig(fileSkuId, rawConfig);
            if (feedbackEntries?.length) {
                applyExplicitFeedback(config, feedbackEntries);
            }
            const result = await ingestOneSku(realSkuId, config, batchId);
            if (result.status === 'touched') {
                batch.skuIds.push(realSkuId);
                batch.events.push({ type: 'sku_ingested', meta: { skuId: realSkuId } });
            } else {
                batch.rejectedSkuIds.push(realSkuId);
                batch.events.push({ type: 'sku_rejected', meta: { skuId: realSkuId, reason: result.reason } });
            }
        } catch (err) {
            batch.errors.push({ skuId: fileSkuId, message: err.message });
            batch.events.push({ type: 'sku_ingest_failed', meta: { skuId: fileSkuId, message: err.message } });
        }
        await batch.save();
    }

    // Phase 2: per-SKU RCA, one LLM call at a time, in full -- every SKU is
    // diagnosed before batch-level clustering ever looks at any of them, so
    // clustering always sees final per-SKU diagnoses, never partial ones.
    // currentlyProcessingSkuId is set for the duration of each SKU's call so
    // a poll can show "processing SKU X (Y of Z)", not just a done-count.
    batch.currentPhase = 'diagnosing_skus';
    await batch.save();
    for (const skuId of batch.skuIds) {
        batch.currentlyProcessingSkuId = skuId;
        await batch.save();
        try {
            await diagnoseSku(skuId);
            batch.diagnosedSkuIds.push(skuId);
            batch.events.push({ type: 'sku_diagnosed', meta: { skuId } });
        } catch (err) {
            batch.errors.push({ skuId, message: `RCA failed: ${err.message}` });
            batch.events.push({ type: 'sku_diagnosis_failed', meta: { skuId, message: err.message } });
        }
        batch.currentlyProcessingSkuId = null;
        await batch.save();
    }

    // Phase 3: batch-level RCA -- looks across every diagnosed SKU together
    // and clusters the handful of real recurring issues, only once every
    // SKU above has a final diagnosis to look at.
    if (batch.diagnosedSkuIds.length) {
        batch.currentPhase = 'batch_rca';
        await batch.save();
        try {
            await runBatchLevelRca(batch._id, batch.diagnosedSkuIds);
            batch.events.push({ type: 'batch_rca_completed', meta: { skuCount: batch.diagnosedSkuIds.length } });
        } catch (err) {
            batch.errors.push({ message: `Batch-level RCA failed: ${err.message}` });
            batch.events.push({ type: 'batch_rca_failed', meta: { message: err.message } });
        }
        await batch.save();

        // Phase 4: reconcile SKU-level issues against the batch-level
        // clusters just produced, merging duplicates into one HITL entry.
        batch.currentPhase = 'reconciling';
        await batch.save();
        try {
            const { mergedCount } = await reconcileBatchDiagnoses(batch._id);
            batch.events.push({ type: 'reconciliation_completed', meta: { mergedCount } });
        } catch (err) {
            batch.errors.push({ message: `Reconciliation failed: ${err.message}` });
            batch.events.push({ type: 'reconciliation_failed', meta: { message: err.message } });
        }
        await batch.save();
    }

    batch.currentPhase = null;
    // 'failed' means something genuinely went wrong -- never for a batch
    // that correctly rejected every SKU because none carried feedback.
    batch.status = batch.errors.length && !batch.skuIds.length ? 'failed' : 'diagnosed';
    batch.events.push({ type: 'batch_finished', meta: { status: batch.status } });
    await batch.save();
};

/** Step 1 + 1b + automated Step 2, folded into one upload. Returns as soon
 * as the batch record exists -- the actual ingestion + RCA work continues
 * in the background; poll getBatchById(id) for live progress. */
const createBatchAndProcess = async ({ configs, createdBy }) => {
    if (!Array.isArray(configs) || !configs.length) {
        throw new Api400Error('configs is required and must be a non-empty array');
    }
    for (const entry of configs) {
        if (!entry?.skuId || !entry?.config) {
            throw new Api400Error('each entry must have { skuId, config }');
        }
    }

    const batch = await L1FeedbackBatchModel.create({
        status: 'processing',
        uploadedFiles: configs.map((c) => ({ skuId: c.skuId })),
        totalSkus: configs.length,
        createdBy,
        events: [{ type: 'batch_created', meta: { totalSkus: configs.length, createdBy } }],
    });

    processBatchInBackground(batch._id, configs).catch(async (err) => {
        await L1FeedbackBatchModel.updateOne(
            { _id: batch._id },
            { $set: { status: 'failed' }, $push: { errors: { message: `batch processing crashed: ${err.message}` } } }
        );
    });

    return getBatchById(batch._id);
};

const getBatchById = async (id) => {
    const batch = await L1FeedbackBatchModel.findById(id).lean();
    if (!batch) {
        throw new Api400Error(`Batch not found: ${id}`);
    }
    return batch;
};

const listBatches = async () => L1FeedbackBatchModel.find().sort({ createdAt: -1 }).limit(50).lean();

/** One-call "session detail" view for the Batch/Session History UI: the
 * batch record itself (input, progress, status, event timeline) plus every
 * SKU trace it touched (full RCA analysis/candidates/decisions) and every
 * ground-truth version it created (the resulting Staging content diffs) --
 * everything the batch's HITL run produced, joined by the ids already
 * carried on each collection (lastBatchId / batchId), no new join table. */
const getBatchDetail = async (id) => {
    const batch = await getBatchById(id);
    const [traces, versions] = await Promise.all([
        L1SkuTraceModel.find({ lastBatchId: id }).lean(),
        L1GroundTruthVersionModel.find({ batchId: id }).sort({ versionNumber: 1 }).lean(),
    ]);
    return { batch, traces, versions };
};

module.exports = {
    createBatchAndProcess,
    getBatchById,
    getBatchDetail,
    listBatches,
    applyExplicitFeedback,
    listAnglesForConfig,
    findClientAngleIdByName,
    unwrapUploadedConfig,
};
