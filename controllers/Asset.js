const { createAsset, searchAssets, resolveSkus, bulkIncrementAssetUsageCounter, bumpIngestionSchedule, findOrCreateSku } = require('../services/asset.service');
const { searchAssetsFuzzy } = require('../services/assetSemanticSearch.service');
const Api501Error = require('../errors/api501Error');
const { mergeAndPropagatePatternDict } = require('../services/sku.service');
const { getS3PreSignedpath } = require('../services/amazonS3Service');
const { ensureClient } = require('../services/client.service');
const mime = require('mime-types');
const { nextSkuSeq } = require('../models/Client.model');
const { nextAssetSeqBlock } = require('../models/Sku.model');
const { formatSkuBarcode, formatAssetFileName } = require('../utils/internalAssetNaming');
const { INTERNAL_ASSETS_BUCKET, INTERNAL_ASSETS_KEY_PREFIX, INTERNAL_CLIENT_NAME, S3_BUCKET } = require('../config');
const Api400Error = require('../errors/api400Error');

const getUploadUrl = async (req, res, next) => {
    try {
        const { fileName, clientName } = req.query;
        const key = `aiStylingAsset/assets/${clientName}/${Date.now()}_${fileName}`;
        const contentType = mime.lookup(fileName) || 'image/jpeg';
        const { url } = await getS3PreSignedpath(key, contentType, S3_BUCKET);
        return res.status(200).json({ key, url, host: S3_BUCKET, contentType });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { clientName, createWithoutCSVData, files } = req.body;

        await ensureClient(clientName);
        const barcodes = files.map(f => f.barcode);
        const skuMap = await resolveSkus(barcodes, clientName, createWithoutCSVData);

        const results = [];
        const skusToBump = new Set();
        for (const file of files) {
            try {
                const sku = skuMap.get(file.barcode);
                if (sku && sku.error) {
                    results.push({ barcode: file.barcode, success: false, error: sku.error });
                    continue;
                }
                if (!sku) {
                    results.push({ barcode: file.barcode, success: false, error: `SKU not found for barcode ${file.barcode}` });
                    continue;
                }

                const shouldNotProduce = sku.shouldNotProduce === true;
                const assetInputs = file.images.map(image => ({
                    skuId: sku._id, barcode: file.barcode, clientName, associatedTo: sku.associatedTo, image, patternDict: sku.patternDict, shouldNotProduce,
                }));

                const BATCH_SIZE = 10;
                const assets = [];
                for (let i = 0; i < assetInputs.length; i += BATCH_SIZE) {
                    const batch = assetInputs.slice(i, i + BATCH_SIZE);
                    const batchResults = await Promise.all(batch.map(input => createAsset(input)));
                    for (const { asset, existed } of batchResults) {
                        if (!existed) skusToBump.add(String(sku._id));
                        assets.push({ _id: asset._id, patternDict: asset.patternDict, existed });
                    }
                }
                // Rows are persisted (for traceability) but we surface failure to the caller so patternDict isn't returned and downstream consumers don't act on them.
                if (shouldNotProduce) {
                    results.push({ barcode: file.barcode, success: false, error: `SKU ${file.barcode} is marked shouldNotProduce` });
                    continue;
                }
                results.push({ barcode: file.barcode, success: true, assets });
            } catch (err) {
                results.push({ barcode: file.barcode, success: false, error: err.message });
            }
        }
        await Promise.all([...skusToBump].map(bumpIngestionSchedule));
        return res.status(200).json({ data: results });
    } catch (err) {
        next(err);
    }
};

const createWithProperties = async (req, res, next) => {
    try {
        const { clientName, createWithoutCSVData, files } = req.body;

        await ensureClient(clientName);
        const barcodes = files.map(f => f.barcode);
        const skuMap = await resolveSkus(barcodes, clientName, createWithoutCSVData);

        const updates = files
            .filter(f => f.skuProperties)
            .map(f => ({ barcode: f.barcode, skuProperties: f.skuProperties }));
        const skuPatternMap = new Map(
            [...skuMap].filter(([, sku]) => sku && !sku.error).map(([barcode, sku]) => [barcode, sku.patternDict || {}])
        );
        const mergedMap = updates.length > 0
            ? await mergeAndPropagatePatternDict(updates, clientName, skuPatternMap)
            : skuPatternMap;

        const results = [];
        const skusToBump = new Set();
        for (const file of files) {
            try {
                const sku = skuMap.get(file.barcode);
                if (sku && sku.error) {
                    results.push({ barcode: file.barcode, success: false, error: sku.error });
                    continue;
                }
                if (!sku) {
                    results.push({ barcode: file.barcode, success: false, error: `SKU not found for barcode ${file.barcode}` });
                    continue;
                }

                const shouldNotProduce = sku.shouldNotProduce === true;
                const patternDict = mergedMap.get(file.barcode) || sku.patternDict;
                const assetInputs = file.images.map(image => ({
                    skuId: sku._id, barcode: file.barcode, clientName, associatedTo: sku.associatedTo, image, patternDict, shouldNotProduce,
                }));

                const BATCH_SIZE = 10;
                const assets = [];
                for (let i = 0; i < assetInputs.length; i += BATCH_SIZE) {
                    const batch = assetInputs.slice(i, i + BATCH_SIZE);
                    const batchResults = await Promise.all(batch.map(input => createAsset(input)));
                    for (const { asset, existed } of batchResults) {
                        if (!existed) skusToBump.add(String(sku._id));
                        assets.push({ _id: asset._id, patternDict: asset.patternDict, existed });
                    }
                }
                // Rows are persisted (for traceability) but we surface failure to the caller so patternDict isn't returned and downstream consumers don't act on them.
                if (shouldNotProduce) {
                    results.push({ barcode: file.barcode, success: false, error: `SKU ${file.barcode} is marked shouldNotProduce` });
                    continue;
                }
                results.push({ barcode: file.barcode, success: true, assets });
            } catch (err) {
                results.push({ barcode: file.barcode, success: false, error: err.message });
            }
        }
        await Promise.all([...skusToBump].map(bumpIngestionSchedule));
        return res.status(200).json({ data: results });
    } catch (err) {
        next(err);
    }
};

const search = async (req, res, next) => {
    try {
        throw new Api501Error('GET /api/v1/asset is being split: use /api/v1/asset/semanticSearch for fuzzy_text search. Mongo filter search will return on this path once FE migrates.');
        // eslint-disable-next-line no-unreachable
        const result = await searchAssets(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const semanticSearch = async (req, res, next) => {
    try {
        const result = await searchAssetsFuzzy(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const semanticSearchPartner = async (req, res, next) => {
    try {
        const result = await searchAssetsFuzzy(req.query, { usePartnerEmbedding: true });
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const updateAssetUsageCounter = async (req, res, next) => {
    try {
        const { assetIds } = req.body;
        const result = await bulkIncrementAssetUsageCounter(assetIds);
        return res.status(200).json({ modifiedCount: result.modifiedCount });
    } catch (err) {
        next(err);
    }
};

const getInternalAssetUploadUrls = async (req, res, next) => {
    try {
        const { clientName, files, associatedTo } = req.body;
        let { barcode } = req.body;
        let skuCreated = false;

        if (clientName === INTERNAL_CLIENT_NAME && !associatedTo) {
            throw new Api400Error('associatedTo is required for internal assets');
        }

        if (!barcode) {
            const skuSeq = await nextSkuSeq(clientName);
            barcode = formatSkuBarcode(clientName, skuSeq);
        } else {
            barcode = barcode.trim();
        }

        const { created } = await findOrCreateSku(barcode, clientName, true, associatedTo);
        skuCreated = created;

        const block = await nextAssetSeqBlock({ barcode, clientName }, files.length);
        if (!block) throw new Api400Error(`SKU not found: ${barcode} (${clientName})`);

        const items = await Promise.all(files.map(async (f, i) => {
            const contentType = f.mimeType || mime.lookup(f.ext) || 'application/octet-stream';
            const assetSeq = block.seqs[i];
            const fileName = formatAssetFileName(barcode, assetSeq, f.ext);
            const key = `${INTERNAL_ASSETS_KEY_PREFIX}/${clientName}/${fileName}`;
            const { url } = await getS3PreSignedpath(key, contentType, INTERNAL_ASSETS_BUCKET);
            return { assetSeq, fileName, key, host: INTERNAL_ASSETS_BUCKET, url, contentType };
        }));

        return res.status(200).json({
            barcode,
            skuId: block.sku._id,
            skuCreated,
            files: items,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { getUploadUrl, getInternalAssetUploadUrls, create, createWithProperties, search, semanticSearch, semanticSearchPartner, updateAssetUsageCounter };
