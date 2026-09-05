const AssetModel = require('../models/Asset.model');
const SkuModel = require('../models/Sku.model');
const SkuCsvModel = require('../models/SkuCsv.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { completeImageObject } = require('../utils/completeImageObject');
const { buildRegexFilter, EXCLUDE_DAR_SCAN_SHOOT_TYPE } = require('../utils/filterValues');
const { INTERNAL_CLIENT_NAME } = require('../config');

const getClientEnableFXGTOM = async (clientName) => {
    const client = await ClientModel.findOne({ code: clientName }, { enableFXGTOM: 1 }).lean();
    return client?.enableFXGTOM !== false;
};



const bumpIngestionSchedule = async (skuId) => {
    const INGESTION_DEBOUNCE_MS = 1 * 60 * 1000;
    const MAX_ASSETS_FOR_REEMBED = 2;
    try {
        const sku = await SkuModel.findById(skuId, { embeddingDone: 1 }).lean();
        if (!sku) return;
        if (sku.embeddingDone) {
            const assetCount = await AssetModel.countDocuments({ skuId, isActive: true });
            if (assetCount > MAX_ASSETS_FOR_REEMBED) return; // already embedded, enough images — skip
        }
        await SkuModel.updateOne(
            { _id: skuId },
            { $set: { ingestionScheduledAt: new Date(Date.now() + INGESTION_DEBOUNCE_MS) } }
        );
    } catch (err) {
        console.LogColor(console.color.FgYellow, `bumpIngestionSchedule failed for ${skuId}: ${err.message}`);
    }
};

const findOrCreateSku = async (barcode, clientName, createWithoutCSVData, associatedTo) => {
    barcode = barcode.trim();
    const existingSku = await SkuModel.findOne({ barcode, clientName }).lean();
    if (existingSku) {
        if (!existingSku.filtersSynced && existingSku.patternDict && Object.keys(existingSku.patternDict).length) {
            global.eventEmitter.emitSafe('filter-update', {
                skuId: existingSku._id,
                clientName,
                patternDict: existingSku.patternDict,
            });
        }
        return { sku: existingSku, created: false };
    }

    const skuCsv = await SkuCsvModel.findOne({ barcode, clientName }, { 'csv.csvData': 1, shouldNotProduce: 1 }).lean();
    const hasCsvData = !!(
        skuCsv &&
        skuCsv.csv &&
        skuCsv.csv.csvData &&
        Object.keys(skuCsv.csv.csvData).length > 0
    );

    if (!createWithoutCSVData && !hasCsvData) {
        throw new Api400Error(
            'SKU has no CSV data. Set createWithoutCSVData to true to bypass.'
        );
    }

    const enableFXGTOM = await getClientEnableFXGTOM(clientName);
    const sku = await SkuModel.create({
        barcode,
        clientName,
        associatedTo,
        patternDict: hasCsvData ? skuCsv.csv.csvData : {},
        createdWithoutCSVDataPreCheck: createWithoutCSVData,
        skuCsvId: skuCsv ? skuCsv._id : undefined,
        shouldNotProduce: skuCsv?.shouldNotProduce === true,
        enableFXGTOM,
    });

    if (sku.patternDict && Object.keys(sku.patternDict).length) {
        global.eventEmitter.emitSafe('filter-update', {
            skuId: sku._id,
            clientName,
            patternDict: sku.patternDict,
        });
    }

    return { sku, created: true };
};

const resolveSkus = async (barcodes, clientName, createWithoutCSVData) => {
    const uniqueBarcodes = [...new Set(barcodes.map(b => b.trim()))];
    console.time('resolveSkus');
    const existingSkus = await SkuModel.find({ barcode: { $in: uniqueBarcodes }, clientName }).hint("barcode_1_clientName_1").lean();
    console.timeEnd('resolveSkus');
    const skuMap = new Map(existingSkus.map(s => [s.barcode, s]));

    for (const sku of existingSkus) {
        if (!sku.filtersSynced && sku.patternDict && Object.keys(sku.patternDict).length) {
            global.eventEmitter.emitSafe('filter-update', { skuId: sku._id, clientName, patternDict: sku.patternDict });
        }
    }

    const missingBarcodes = uniqueBarcodes.filter(b => !skuMap.has(b));
    if (missingBarcodes.length === 0) return skuMap;

    const skuCsvs = await SkuCsvModel.find(
        { barcode: { $in: missingBarcodes }, clientName },
        { barcode: 1, 'csv.csvData': 1, shouldNotProduce: 1 }
    ).lean();
    const csvMap = new Map(skuCsvs.map(s => [s.barcode, s]));

    const toCreate = [];
    for (const barcode of missingBarcodes) {
        const skuCsv = csvMap.get(barcode);
        const hasCsvData = !!(skuCsv?.csv?.csvData && Object.keys(skuCsv.csv.csvData).length > 0);

        if (!createWithoutCSVData && !hasCsvData) {
            skuMap.set(barcode, { error: `SKU ${barcode} has no CSV data. Set createWithoutCSVData to true to bypass.` });
            continue;
        }

        toCreate.push({
            barcode,
            clientName,
            patternDict: hasCsvData ? skuCsv.csv.csvData : {},
            createdWithoutCSVDataPreCheck: createWithoutCSVData,
            skuCsvId: skuCsv ? skuCsv._id : undefined,
            shouldNotProduce: skuCsv?.shouldNotProduce === true,
        });
    }

    const enableFXGTOM = toCreate.length ? await getClientEnableFXGTOM(clientName) : true;
    toCreate.forEach((doc) => { doc.enableFXGTOM = enableFXGTOM; });
    const newSkus = await SkuModel.insertMany(toCreate);
    for (const sku of newSkus) {
        skuMap.set(sku.barcode, sku);
        if (sku.patternDict && Object.keys(sku.patternDict).length) {
            global.eventEmitter.emitSafe('filter-update', { skuId: sku._id, clientName, patternDict: sku.patternDict });
        }
    }

    return skuMap;
};

const createAsset = async (data) => {
    const filter = {
        skuId: data.skuId,
        'image.imagePath.host': data.image?.imagePath?.host,
        'image.imagePath.key': data.image?.imagePath?.key,
        isActive: true,
    };
    const existing = await AssetModel.findOne(filter);
    if (existing) return { asset: existing, existed: true };
    try {
        const asset = await AssetModel.create(data);
        return { asset, existed: false };
    } catch (err) {
        if (err.code === 11000) {
            const asset = await AssetModel.findOne(filter);
            return { asset, existed: true };
        }
        throw err;
    }
};

const searchAssets = async ({ pageNum, pageSize, filter: patternDict, isActive, skuId, clientName, includeInternal, ...rest }) => {
    const filter = {};

    for (const [key, val] of Object.entries(rest)) {
        filter[key] = buildRegexFilter(val);
    }
    filter.isActive = isActive !== undefined ? isActive === 'true' : true;
    filter.shouldNotProduce = { $ne: true };
    Object.assign(filter, EXCLUDE_DAR_SCAN_SHOOT_TYPE);
    if (skuId) filter.skuId = skuId;
    if (includeInternal && clientName !== INTERNAL_CLIENT_NAME) {
        filter.$or = [
            { clientName },
            { clientName: INTERNAL_CLIENT_NAME, associatedTo: clientName },
        ];
    } else {
        filter.clientName = clientName;
    }

    if (patternDict && typeof patternDict === 'object') {
        for (const [k, v] of Object.entries(patternDict)) {
            filter[`patternDict.${k}`] = Array.isArray(v) ? { $in: v } : v;
        }
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });

    const [data, total] = await Promise.all([
        AssetModel.find(filter).populate('skuId').skip(skip).limit(limit).lean(),
        AssetModel.countDocuments(filter),
    ]);
    const mapped = data.map(({ skuId, ...rest }) => ({ ...rest, sku: skuId }));
    mapped.forEach((row) => {
        if (row.image) completeImageObject(row.image);
        row.isInternal = row.clientName === INTERNAL_CLIENT_NAME;
    });
    return { data: mapped, pagination: { total, pageNum: parseInt(pageNum) || 1, pageSize: limit, totalPages: Math.ceil(total / limit) } };
};

const bulkIncrementAssetUsageCounter = async (assetIds) => {
    const result = await AssetModel.updateMany(
        { _id: { $in: assetIds } },
        { $inc: { usageCounter: 1 } }
    );
    return result;
};

module.exports = { findOrCreateSku, resolveSkus, createAsset, searchAssets, bulkIncrementAssetUsageCounter, bumpIngestionSchedule };
