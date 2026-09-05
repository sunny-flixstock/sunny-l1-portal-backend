// Embedding sync for DescriptionModelImage — face/identity embeddings at 512-d.
// Uses the InsightFace buffalo_l Lambda (ArcFace) via utils/lambda.js.
const DescriptionModelImage = require('../../models/DescriptionModelImage.model');
const vectorStore = require('./descriptionModelImageVectorStore.service');
const insightface = require('./providers/insightface.provider');

const generateEmbedding = (bucket, s3Key) => insightface.embed(bucket, s3Key);

const MAX_EMBEDDING_ATTEMPTS = 2;

const syncDescriptionModelImageEmbedding = async (docId) => {
    const tag = `[dmi-embed ${docId}]`;

    const doc = await DescriptionModelImage.findOne({ _id: docId, isActive: true });
    if (!doc) {
        console.LogColor(console.color.FgYellow, `${tag} skipping — doc not found or inactive`);
        return;
    }
    if (doc.embeddingDone) {
        console.LogColor(console.color.FgYellow, `${tag} skipping — embeddingDone=true`);
        return;
    }
    if (doc.embeddingFailedPermanently) {
        console.LogColor(console.color.FgYellow, `${tag} skipping — embeddingFailedPermanently=true`);
        return;
    }

    const key = doc.croppedImage?.imagePath?.key;
    if (!key) {
        console.LogColor(console.color.FgYellow, `${tag} skipping — no croppedImage key`);
        return;
    }
    const bucket = doc.croppedImage?.imagePath?.host || 'fxgati';

    try {
        const t0 = Date.now();
        const embedding = await generateEmbedding(bucket, key);
        console.LogColor(console.color.FgCyan, `${tag} embedded in ${Date.now() - t0}ms`);

        await vectorStore.upsert({
            docId: doc._id.toString(),
            modelIdentity: doc.modelIdentity,
            embedding,
        });

        await DescriptionModelImage.updateOne(
            { _id: doc._id },
            { embeddingDone: true, embeddingRetryCount: 0 }
        );
        console.LogColor(console.color.FgGreen, `${tag} upserted + embeddingDone=true`);
    } catch (err) {
        const nextCount = (doc.embeddingRetryCount || 0) + 1;
        const permanent = nextCount >= MAX_EMBEDDING_ATTEMPTS;
        await DescriptionModelImage.updateOne(
            { _id: doc._id },
            { embeddingRetryCount: nextCount, embeddingFailedPermanently: permanent }
        );
        console.LogColor(
            console.color.FgRed,
            `${tag} attempt ${nextCount}/${MAX_EMBEDDING_ATTEMPTS} failed${permanent ? ' — marking permanently failed' : ''}: ${err.message}`
        );
        throw err;
    }
};

const REINDEX_BATCH_SIZE = 50;
const REINDEX_CONCURRENCY = 10;

const reindex = async ({ modelIdentity } = {}) => {
    const baseFilter = { embeddingDone: { $ne: true }, embeddingFailedPermanently: { $ne: true }, isActive: true };
    if (modelIdentity) baseFilter.modelIdentity = modelIdentity;

    let processed = 0;
    let failed = 0;
    let cursor = null;

    while (true) {
        const query = { ...baseFilter };
        if (cursor) query._id = { $gt: cursor };

        const docs = await DescriptionModelImage.find(query).sort({ _id: 1 }).limit(REINDEX_BATCH_SIZE);
        if (!docs.length) break;

        for (let i = 0; i < docs.length; i += REINDEX_CONCURRENCY) {
            const chunk = docs.slice(i, i + REINDEX_CONCURRENCY);
            const results = await Promise.allSettled(chunk.map((d) => syncDescriptionModelImageEmbedding(d._id)));
            for (let j = 0; j < results.length; j++) {
                if (results[j].status === 'fulfilled') processed++;
                else {
                    failed++;
                    console.LogColor(console.color.FgRed, `reindex failed for ${chunk[j]._id}: ${results[j].reason?.message}`);
                }
            }
        }

        cursor = docs[docs.length - 1]._id;
        if (docs.length < REINDEX_BATCH_SIZE) break;
    }

    return { processed, failed };
};

module.exports = { syncDescriptionModelImageEmbedding, generateEmbedding, reindex };
