const SkuModel = require('../models/Sku.model');
const vectorStore = require('./vectorStore.service');
const { generateEmbedding, buildEmbedText, buildPartnerEmbedText } = require('./embedding/embedding.service');

const buildMetadata = (sku) => {
    const obj = sku.toObject ? sku.toObject() : sku;
    const { createdAt, updatedAt, __v, skuImageDescription, embeddingDone, readyForEmbedding, ...rest } = obj;

    const metadata = {};
    for (const [key, val] of Object.entries(rest)) {
        if (val === null || val === undefined) continue;
        if (key === '_id') metadata[key] = val.toString();
        else metadata[key] = val;
    }
    return metadata;
};

const syncSkuEmbedding = async (sku) => {
    const tag = `[embed ${sku.barcode || sku._id}]`;
    if (!sku.readyForEmbedding || sku.embeddingDone) {
        console.LogColor(console.color.FgYellow, `${tag} skipping — readyForEmbedding=${sku.readyForEmbedding}, embeddingDone=${sku.embeddingDone}`);
        return;
    }
    const fresh = await SkuModel.findById(sku._id);
    if (!fresh?.skuImageDescription) {
        console.LogColor(console.color.FgYellow, `${tag} skipping — no skuImageDescription`);
        return;
    }
    const text = buildEmbedText(fresh);
    if (!text.trim()) {
        console.LogColor(console.color.FgYellow, `${tag} skipping — empty embed text`);
        return;
    }

    const partnerText = buildPartnerEmbedText(fresh);

    const t0 = Date.now();
    const [embedding, embeddingPartner] = await Promise.all([
        generateEmbedding(text),
        partnerText ? generateEmbedding(partnerText) : Promise.resolve(null),
    ]);
    const partnerSummary = embeddingPartner ? `${partnerText.length}ch` : 'skipped';
    console.LogColor(console.color.FgCyan, `${tag} embedded normal=${text.length}ch partner=${partnerSummary} in ${Date.now() - t0}ms`);

    const metadata = buildMetadata(fresh);
    await vectorStore.upsert({
        skuId: sku._id.toString(),
        embedding,
        embeddingPartner,
        clientName: sku.clientName,
        isActive: sku.isActive,
        shouldNotProduce: !!fresh.shouldNotProduce,
        metadata,
    });

    await SkuModel.updateOne({ _id: sku._id }, { embeddingDone: true });
    console.LogColor(console.color.FgGreen, `${tag} upserted to pg + flipped embeddingDone=true`);
};

const REINDEX_BATCH_SIZE = 100;
const REINDEX_CONCURRENCY = 100;

const reindex = async ({ clientName } = {}) => {
    const baseFilter = { readyForEmbedding: true, embeddingDone: { $ne: true } };
    if (clientName) baseFilter.clientName = clientName;

    let processed = 0;
    let failed = 0;
    let cursor = null;

    while (true) {
        const query = { ...baseFilter };
        if (cursor) query._id = { $gt: cursor };

        const skus = await SkuModel.find(query).sort({ _id: 1 }).limit(REINDEX_BATCH_SIZE);
        if (!skus.length) break;

        for (let i = 0; i < skus.length; i += REINDEX_CONCURRENCY) {
            const chunk = skus.slice(i, i + REINDEX_CONCURRENCY);
            const results = await Promise.allSettled(chunk.map((sku) => syncSkuEmbedding(sku)));
            for (let j = 0; j < results.length; j++) {
                if (results[j].status === 'fulfilled') {
                    processed++;
                } else {
                    failed++;
                    console.LogColor(
                        console.color.FgRed,
                        `Failed to sync embedding for sku ${chunk[j]._id}: ${results[j].reason?.message}`
                    );
                }
            }
        }

        cursor = skus[skus.length - 1]._id;
        if (skus.length < REINDEX_BATCH_SIZE) break;
    }

    return { processed, failed };
};

const backfillMetadata = async ({ clientName } = {}) => {
    const baseFilter = { embeddingDone: true };
    if (clientName) baseFilter.clientName = clientName;
    let processed = 0;
    let failed = 0;
    let cursor = null;
    while (true) {
        const query = { ...baseFilter };
        if (cursor) query._id = { $gt: cursor };
        const skus = await SkuModel.find(query).sort({ _id: 1 }).limit(200);
        if (!skus.length) break;
        const results = await Promise.allSettled(skus.map(async (sku) => {
            const metadata = buildMetadata(sku);
            await vectorStore.updateMetadata({ skuId: sku._id.toString(), metadata });
        }));
        for (let i = 0; i < results.length; i++) {
            if (results[i].status === 'fulfilled') processed++;
            else {
                failed++;
                console.LogColor(console.color.FgRed, `backfill failed for sku ${skus[i]._id}: ${results[i].reason?.message}`);
            }
        }
        cursor = skus[skus.length - 1]._id;
    }
    return { processed, failed };
};

module.exports = { syncSkuEmbedding, reindex, buildMetadata, backfillMetadata };
