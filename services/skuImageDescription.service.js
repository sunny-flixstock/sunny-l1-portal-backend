const axios = require('axios');
const mime = require('mime-types');
const SkuModel = require('../models/Sku.model');
const AssetModel = require('../models/Asset.model');
const { getUrlFromKey } = require('../utils/CloudFront.s3');
const { GEMINI_VISION_MODEL, GEMINI_API_KEY } = require('../config');
const { analyzeGarment } = require('./geminiVision.service');
const { systemInstruction: GARMENT_ANALYST_PROMPT } = require('../systemInstructions/garmentAnalyst');
const { systemInstruction: GARMENT_CATEGORIZATION_PROMPT, heroCategories } = require('../systemInstructions/garmentCategorization');

const MAX_IMAGES_PER_SKU = 10;
const BATCH_SIZE = 50;
const CONCURRENCY = 20;
const IMAGE_FETCH_TIMEOUT_MS = 20000;
const GEMINI_SUPPORTED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const resolveMime = (url) => mime.lookup(url.split('?')[0]) || null;

const fetchImageBuffers = async (assets) => {
    const seen = new Set();
    const urls = [];
    for (const asset of assets) {
        const path = asset.image?.thumbPath?.key ? asset.image.thumbPath : asset.image?.imagePath;
        if (!path?.key || !path?.host) continue;
        const { url } = getUrlFromKey(path.key, undefined, path.host);
        if (seen.has(url)) continue;
        seen.add(url);
        urls.push(url);
        if (urls.length >= MAX_IMAGES_PER_SKU) break;
    }
    if (!urls.length) return [];

    const settled = await Promise.allSettled(
        urls.map((url) => axios.get(url, { responseType: 'arraybuffer', timeout: IMAGE_FETCH_TIMEOUT_MS }))
    );

    const images = [];
    for (let i = 0; i < settled.length; i++) {
        const r = settled[i];
        if (r.status !== 'fulfilled') {
            console.LogColor(console.color.FgYellow, `Image fetch failed (${urls[i]}): ${r.reason?.message}`);
            continue;
        }
        const mimeType = resolveMime(urls[i]);
        if (!mimeType || !GEMINI_SUPPORTED_MIMES.has(mimeType)) {
            console.LogColor(console.color.FgYellow, `Skipping unsupported MIME ${mimeType} (${urls[i]})`);
            continue;
        }
        images.push({ buffer: Buffer.from(r.value.data), mimeType });
    }
    return images;
};

const generateForSku = async (sku) => {
    const tag = `[vision ${sku.barcode || sku._id}]`;
    const assets = await AssetModel.find({ skuId: sku._id, isActive: true })
        .sort({ createdAt: -1 })
        .limit(MAX_IMAGES_PER_SKU);
    console.LogColor(console.color.FgCyan, `${tag} found ${assets.length} active asset(s)`);

    const images = await fetchImageBuffers(assets);
    console.LogColor(console.color.FgCyan, `${tag} ${images.length} usable image(s) for Gemini`);
    if (!images.length) return { skipped: 'no-images' };

    const t0 = Date.now();
    const [descResult, categorization] = await Promise.all([
        analyzeGarment({ systemPrompt: GARMENT_ANALYST_PROMPT, images }),
        analyzeGarment({
            systemPrompt: GARMENT_CATEGORIZATION_PROMPT,
            images,
            text: `hero_categories: ${JSON.stringify(heroCategories)}`,
        }).catch((err) => {
            console.LogColor(console.color.FgYellow, `${tag} categorization failed: ${err.message}`);
            return null;
        }),
    ]);
    console.LogColor(console.color.FgCyan, `${tag} Gemini returned in ${Date.now() - t0}ms`);
    const description = JSON.stringify(descResult);

    const update = {
        skuImageDescription: description,
        readyForEmbedding: true,
        embeddingDone: false,
    };
    if (categorization && categorization.category) {
        update.garmentCategorization = {
            category: categorization.category,
            confidence: categorization.confidence,
            reasoning: categorization.reasoning,
        };
    }

    await SkuModel.updateOne({ _id: sku._id }, update);

    const freshSku = { ...(sku.toObject ? sku.toObject() : sku), _id: sku._id, skuImageDescription: description, readyForEmbedding: true, embeddingDone: false };
    console.LogColor(console.color.FgGreen, `${tag} saved description (${description.length} chars JSON), emitting embedding-sync`);
    global.eventEmitter.emitSafe('embedding-sync', { sku: freshSku });
    return { ok: true, descLen: description.length };
};

const generateForAllMissing = async ({ clientName } = {}) => {
    const baseFilter = { isActive: true, skuImageDescription: { $exists: false } };
    if (clientName) baseFilter.clientName = clientName;

    const candidateCount = await SkuModel.countDocuments(baseFilter);
    console.LogColor(
        console.color.FgMagenta,
        `[generateForAllMissing] model=${GEMINI_VISION_MODEL} hasKey=${!!GEMINI_API_KEY} clientName=${clientName || '<all>'} candidates=${candidateCount}`
    );

    let processed = 0;
    let skippedNoImages = 0;
    let failed = 0;
    let cursor = null;

    while (true) {
        const query = { ...baseFilter };
        if (cursor) query._id = { $gt: cursor };

        const skus = await SkuModel.find(query).sort({ _id: 1 }).limit(BATCH_SIZE);
        if (!skus.length) break;

        for (let i = 0; i < skus.length; i += CONCURRENCY) {
            const chunk = skus.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(chunk.map((sku) => generateForSku(sku)));
            for (let j = 0; j < results.length; j++) {
                const r = results[j];
                if (r.status === 'fulfilled') {
                    if (r.value?.skipped === 'no-images') skippedNoImages++;
                    else processed++;
                } else {
                    failed++;
                    console.LogColor(
                        console.color.FgRed,
                        `Vision sync failed for sku ${chunk[j]._id}: ${r.reason?.message}`
                    );
                }
            }
        }

        cursor = skus[skus.length - 1]._id;
        if (skus.length < BATCH_SIZE) break;
    }

    return { processed, skippedNoImages, failed };
};

module.exports = { generateForSku, generateForAllMissing };
