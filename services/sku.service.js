const SkuCsvModel = require('../models/SkuCsv.model');
const SkuModel = require('../models/Sku.model');
const AssetModel = require('../models/Asset.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { completeImageObject } = require('../utils/completeImageObject');
const { buildRegexFilter, EXCLUDE_DAR_SCAN_SHOOT_TYPE } = require('../utils/filterValues');
const { setShouldNotProduce: setVectorShouldNotProduce } = require('./vectorStore.service');
const { INTERNAL_CLIENT_NAME } = require('../config');
const mongoose = require('mongoose');

const getExistingPatternMap = async (barcodes, clientName) => {
    const existingSkus = await SkuModel.find({ barcode: { $in: barcodes }, clientName }, { barcode: 1, patternDict: 1 });
    return new Map(existingSkus.map(s => [s.barcode, s.patternDict || {}]));
};

/**
 * Merges properties into existing SKU patternDicts and propagates to both SKU and Asset models.
 * @param {Array<{ barcode: string, skuProperties: Object }>} updates
 * @param {string} clientName
 * @param {Map<string, Object>} skuPatternMap — barcode→patternDict map
 * @returns {Map<string, Object>} barcode → merged patternDict
 */
const mergeAndPropagatePatternDict = async (updates, clientName, skuPatternMap) => {
    skuPatternMap = new Map(skuPatternMap);

    const skuOps = [];
    const assetOps = [];
    for (const { barcode, skuProperties } of updates) {
        const existing = skuPatternMap.get(barcode) || {};
        const merged = { ...existing, ...skuProperties };

        skuOps.push({
            updateOne: {
                filter: { barcode, clientName },
                update: { $set: { patternDict: merged, filtersSynced: false, embeddingDone: false } },
            },
        });

        assetOps.push({
            updateMany: {
                filter: { barcode, clientName },
                update: { $set: { patternDict: merged } },
            },
        });

        skuPatternMap.set(barcode, merged);
    }

    await Promise.all([
        SkuModel.bulkWrite(skuOps, { ordered: false }),
        AssetModel.bulkWrite(assetOps, { ordered: false }),
    ]);

    return skuPatternMap;
};

const upsertFromCsv = async ({ rows, ingestion, clientName }) => {
    const ingestedAt = ingestion?.createdAt || new Date();
    // Upsert SkuCsv — use dot-notation to merge csvData fields instead of replacing
    const skuCsvOps = rows.map(row => {
        const barcode = row.barcode.trim();
        const csvDataFields = {};
        for (const [k, v] of Object.entries(row)) {
            csvDataFields[`csv.csvData.${k}`] = v;
        }
        const set = {
            barcode,
            clientName,
            ...csvDataFields,
            'csv.ingestedAt': ingestedAt,
        };
        if (ingestion) set['csv.csvIngestionId'] = ingestion._id;
        return {
            updateOne: {
                filter: { barcode, clientName },
                update: { $set: set },
                upsert: true,
            },
        };
    });

    const updates = rows.map(r => ({ barcode: r.barcode.trim(), skuProperties: r }));
    const barcodes = updates.map(u => u.barcode);
    const [result, skuPatternMap] = await Promise.all([
        SkuCsvModel.bulkWrite(skuCsvOps, { ordered: false }),
        getExistingPatternMap(barcodes, clientName),
    ]);
    await mergeAndPropagatePatternDict(updates, clientName, skuPatternMap);

    return { upsertedCount: result.upsertedCount, modifiedCount: result.modifiedCount };
};

const parseDateStart = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
};

const parseDateEnd = (value) => {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    d.setHours(23, 59, 59, 999);
    return d;
};

const enrichSkusWithAssets = async (data) => {
    if (!data.length) return;

    const skuIds = data.map(s => s._id);
    const assetGroups = await AssetModel.aggregate([
        { $match: { skuId: { $in: skuIds }, isActive: true, shouldNotProduce: { $ne: true } } },
        { $sort: { createdAt: 1 } },
        {
            $group: {
                _id: '$skuId',
                assets: { $push: { _id: '$_id', barcode: '$barcode', image: '$image', createdAt: '$createdAt' } },
            },
        },
    ]);
    const assetsBySkuId = new Map(assetGroups.map(g => [g._id.toString(), g.assets]));
    data.forEach(sku => {
        const assets = assetsBySkuId.get(sku._id.toString()) || [];
        assets.forEach(asset => {
            if (asset?.image) completeImageObject(asset.image);
        });
        sku.assets = assets;
        sku.displayAsset = assets[0] || null;
    });
};

const getSkuStatsByClient = async () => {
    const activeSkuMatch = { isActive: true, shouldNotProduce: { $ne: true }, ...EXCLUDE_DAR_SCAN_SHOOT_TYPE };
    const [skuCounts, internalSkuCounts, clients] = await Promise.all([
        SkuModel.aggregate([
            { $match: activeSkuMatch },
            { $group: { _id: '$clientName', skuCount: { $sum: 1 } } },
        ]),
        SkuModel.aggregate([
            {
                $match: {
                    ...activeSkuMatch,
                    clientName: INTERNAL_CLIENT_NAME,
                    associatedTo: { $exists: true, $nin: [null, ''] },
                },
            },
            { $group: { _id: '$associatedTo', internalSkuCount: { $sum: 1 } } },
        ]),
        ClientModel.find({}, { code: 1 }).sort({ code: 1 }).lean(),
    ]);

    const skuCountByClient = new Map(skuCounts.map(c => [c._id, c.skuCount]));
    const internalSkuCountByClient = new Map(
        internalSkuCounts.map(c => [c._id, c.internalSkuCount])
    );
    const data = clients.map(c => ({
        clientName: c.code,
        skuCount: skuCountByClient.get(c.code) || 0,
        internalSkuCount: internalSkuCountByClient.get(c.code) || 0,
    }));

    return { data, total: data.length };
};

const searchSkus = async ({
    pageNum,
    pageSize,
    filter: patternDict,
    isActive,
    createdWithoutCSVDataPreCheck,
    category,
    createdAfter,
    createdBefore,
    embeddingDone,
    clientName,
    includeShouldNotProduce,
    assetType = 'client',
    ...rest
}) => {
    const filter = {};

    for (const [key, val] of Object.entries(rest)) {
        filter[key] = buildRegexFilter(val);
    }
    if (assetType === 'internal') {
        filter.clientName = INTERNAL_CLIENT_NAME;
        filter.associatedTo = clientName;
    } else {
        filter.clientName = clientName;
    }
    filter.isActive = isActive !== undefined ? isActive === 'true' : true;

    if (includeShouldNotProduce !== 'true') {
        filter.shouldNotProduce = { $ne: true };
    }

    Object.assign(filter, EXCLUDE_DAR_SCAN_SHOOT_TYPE);
    if (createdWithoutCSVDataPreCheck !== undefined) filter.createdWithoutCSVDataPreCheck = createdWithoutCSVDataPreCheck === 'true';
    if (category) filter['garmentCategorization.category'] = buildRegexFilter(category);
    if (embeddingDone !== undefined) filter.embeddingDone = embeddingDone === 'true';

    const after = parseDateStart(createdAfter);
    const before = parseDateEnd(createdBefore);
    if (after || before) {
        filter.createdAt = {};
        if (after) filter.createdAt.$gte = after;
        if (before) filter.createdAt.$lte = before;
    }

    if (patternDict && typeof patternDict === 'object') {
        for (const [k, v] of Object.entries(patternDict)) {
            filter[`patternDict.${k}`] = Array.isArray(v) ? { $in: v } : v;
        }
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });

    const [data, total] = await Promise.all([
        SkuModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        SkuModel.countDocuments(filter),
    ]);

    await enrichSkusWithAssets(data);

    return { data, pagination: { total, pageNum: parseInt(pageNum) || 1, pageSize: limit, totalPages: Math.ceil(total / limit) } };
};

const getSkuById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid SKU id');
    }

    const sku = await SkuModel.findById(id).lean();
    if (!sku) throw new Api400Error(`SKU not found: ${id}`);

    const assets = await AssetModel.find(
        { skuId: sku._id, isActive: true, shouldNotProduce: { $ne: true } },
        { _id: 1, barcode: 1, image: 1, createdAt: 1, usageCounter: 1 }
    )
        .sort({ createdAt: 1 })
        .lean();

    assets.forEach(asset => {
        if (asset?.image) completeImageObject(asset.image);
    });

    return { ...sku, assets };
};

const getSkuByClientAndBarcode = async ({ clientName, barcode }) => {
    const sku = await SkuModel.findOne({ clientName, barcode: barcode.trim() }).lean();
    if (!sku) throw new Api400Error(`SKU not found: ${clientName}/${barcode}`);
    return { sku  };
};

const DISALLOWED_AGGREGATION_STAGES = ['$out', '$merge'];

const aggregateSkus = async (pipeline) => {
    for (const stage of pipeline) {
        const stageName = Object.keys(stage)[0];
        if (DISALLOWED_AGGREGATION_STAGES.includes(stageName)) {
            throw new Api400Error(`Aggregation stage not allowed: ${stageName}`);
        }
    }
    const data = await SkuModel.aggregate(pipeline);
    return { data };
};

const setSkuShouldNotProduce = async ({ barcode, clientName, shouldNotProduce }) => {
    const skuCsvRes = await SkuCsvModel.updateOne(
        { barcode, clientName },
        { $set: { shouldNotProduce, barcode, clientName } },
        { upsert: true }
    );
    const skuCsvUpserted = !!skuCsvRes.upsertedId;

    const sku = await SkuModel.findOne({ barcode, clientName }, { _id: 1, shouldNotProduce: 1 }).lean();
    if (!sku) {
        return { shouldNotProduce, skuExisted: false, skuCsvUpserted, assetsUpdated: 0, vectorRowsUpdated: 0 };
    }

    if ((sku.shouldNotProduce || false) === shouldNotProduce) {
        return { shouldNotProduce, skuExisted: true, skuCsvUpserted, assetsUpdated: 0, vectorRowsUpdated: 0 };
    }

    await SkuModel.updateOne({ _id: sku._id }, { $set: { shouldNotProduce } });
    const [assetRes, vectorRowsUpdated] = await Promise.all([
        AssetModel.updateMany({ skuId: sku._id }, { $set: { shouldNotProduce } }),
        setVectorShouldNotProduce({ skuId: sku._id.toString(), shouldNotProduce }),
    ]);

    return { shouldNotProduce, skuExisted: true, skuCsvUpserted, assetsUpdated: assetRes.modifiedCount, vectorRowsUpdated };
};

module.exports = {
    upsertFromCsv,
    searchSkus,
    getSkuStatsByClient,
    getSkuById,
    getSkuByClientAndBarcode,
    mergeAndPropagatePatternDict,
    setSkuShouldNotProduce,
    aggregateSkus,
};
