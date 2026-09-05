const AssetModel = require('../models/Asset.model');
const SkuModel = require('../models/Sku.model');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { completeImageObject } = require('../utils/completeImageObject');
const vectorStore = require('./vectorStore.service');
const { generateEmbedding } = require('./embedding/embedding.service');
const { searchAssets } = require('./asset.service');
const { INTERNAL_CLIENT_NAME } = require('../config');
const { escapeRegex } = require('../utils/regex');

const buildAssetWhere = ({ clientName, includeInternal, isActive, barcode, skuId, category, patternDict, rest }) => {
    const conditions = [];
    const params = [];
    const push = (v) => { params.push(v); return `$${params.length}`; };

    const addJsonbFilter = (obj, extraPath, { exact = false } = {}) => {
        const path = extraPath ? `'${extraPath}', ` : '';
        const op = exact ? '=' : '~*';
        for (const [k, v] of Object.entries(obj)) {
            const keyPh = push(k);
            const targets = Array.isArray(v) ? v : [v];
            const ors = targets.map((val) => {
                const s = String(val);
                return `jsonb_extract_path_text(metadata, ${path}${keyPh}) ${op} ${push(exact ? s : escapeRegex(s))}`;
            });
            conditions.push(targets.length > 1 ? `(${ors.join(' OR ')})` : ors[0]);
        }
    };

    if (clientName) {
        if (includeInternal && clientName !== INTERNAL_CLIENT_NAME) {
            const clientPh = push(clientName);
            const internalPh = push(INTERNAL_CLIENT_NAME);
            conditions.push(
                `(client_name = ${clientPh} OR (client_name = ${internalPh} AND metadata->>'associatedTo' = ${clientPh}))`
            );
        } else {
            conditions.push(`client_name = ${push(clientName)}`);
        }
    }
    if (isActive !== undefined) conditions.push(`is_active = ${push(isActive)}`);
    conditions.push(`should_not_produce IS NOT TRUE`);
    if (barcode) conditions.push(`(metadata->>'barcode') ~* ${push(escapeRegex(barcode))}`);
    if (skuId) conditions.push(`sku_id = ${push(skuId)}`);
    if (category) conditions.push(`lower(jsonb_extract_path_text(metadata, 'garmentCategorization', 'category')) LIKE lower(${push(category)}) || '%'`);
    if (patternDict && typeof patternDict === 'object') addJsonbFilter(patternDict, 'patternDict', { exact: true });
    if (rest && typeof rest === 'object') {
        const { assetType, ...restWithoutAssetType } = rest;
        if (Object.keys(restWithoutAssetType).length > 0) {
            addJsonbFilter(restWithoutAssetType, null);
        }
    }

    return { whereClause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
};

const findSkuHitsByVector = async (query, { usePartnerEmbedding = false } = {}) => {
    const { pageNum, pageSize, filter: patternDict, isActive, skuId, category, fuzzy_text, clientName, barcode, includeInternal, ...rest } = query;
    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });

    const embedding = fuzzy_text ? await generateEmbedding(fuzzy_text, { kind: 'query' }) : null;
    const { whereClause, params } = buildAssetWhere({
        clientName,
        includeInternal,
        isActive: isActive !== undefined ? isActive === 'true' : true,
        barcode,
        skuId,
        category,
        patternDict,
        rest,
    });

    const { hits, total, actualTotal } = await vectorStore.searchByEmbedding({
        embedding,
        whereClause,
        whereParams: params,
        skip,
        limit,
        column: usePartnerEmbedding ? 'embedding_partner' : 'embedding',
    });

    const pagination = {
        unit: 'sku',
        total,
        actualTotal,
        pageNum: parseInt(pageNum) || 1,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
    };

    const skuIdsOrdered = hits.map((h) => h.skuId);
    const similarityBySku = new Map(hits.map((h) => [h.skuId, h.similarity]));

    return { skuIdsOrdered, similarityBySku, pagination };
};

const searchAssetsFuzzy = async (query, opts = {}) => {
    // if (!query.fuzzy_text) return searchAssets(query);

    const { skuIdsOrdered, similarityBySku, pagination } = await findSkuHitsByVector(query, opts);
    if (!skuIdsOrdered.length) return { data: [], pagination };

    const skuRank = new Map(skuIdsOrdered.map((id, i) => [id, i]));

    const assetFilter = { skuId: { $in: skuIdsOrdered } };
    assetFilter.isActive = query.isActive !== undefined ? query.isActive === 'true' : true;
    assetFilter.shouldNotProduce = { $ne: true };

    const assets = await AssetModel.find(assetFilter).populate({ path: 'skuId', select: '-skuImageDescription' });

    assets.sort((a, b) => {
        const ra = skuRank.get(a.skuId._id.toString()) ?? Infinity;
        const rb = skuRank.get(b.skuId._id.toString()) ?? Infinity;
        if (ra !== rb) return ra - rb;
        return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const data = assets.map((doc) => {
        const { skuId, ...rest } = doc.toObject();
        const item = { ...rest, sku: skuId, similarity: similarityBySku.get(skuId._id.toString()) || 0 };
        if (item.image) completeImageObject(item.image);
        item.isInternal = item.clientName === INTERNAL_CLIENT_NAME;
        return item;
    });

    return { data, pagination };
};

const searchSkusFuzzy = async (query, opts = {}) => {
    const { skuIdsOrdered, similarityBySku, pagination } = await findSkuHitsByVector(query, opts);
    if (!skuIdsOrdered.length) return { data: [], pagination };

    const skus = await SkuModel.find(
        { _id: { $in: skuIdsOrdered }, shouldNotProduce: { $ne: true } },
        { _id: 1, barcode: 1, clientName: 1, skuImageDescription: 1, garmentCategorization: 1, patternDict: 1 }
    ).lean();
    const bySku = new Map(skus.map((s) => [s._id.toString(), s]));

    const parseDescription = (d) => {
        if (typeof d !== 'string') return d;
        try { return JSON.parse(d); } catch { return d; }
    };

    const data = skuIdsOrdered
        .map((id) => bySku.get(id.toString()))
        .filter(Boolean)
        .map((sku) => ({
            ...sku,
            skuImageDescription: parseDescription(sku.skuImageDescription),
            similarity: similarityBySku.get(sku._id.toString()) || 0,
        }));

    return { data, pagination };
};

const searchSkusFuzzyWithAssets = async (query, opts = {}) => {
    const result = await searchSkusFuzzy(query, opts);
    if (!result.data.length) return result;

    const skuIds = result.data.map((s) => s._id);
    const assets = await AssetModel.find(
        { skuId: { $in: skuIds }, isActive: true, shouldNotProduce: { $ne: true } },
        { _id: 1, skuId: 1, image: 1, usageCounter: 1, createdAt: 1 }
    );

    const assetsBySku = new Map();
    for (const doc of assets) {
        const { skuId, ...rest } = doc.toObject();
        const key = skuId.toString();
        if (!assetsBySku.has(key)) assetsBySku.set(key, []);
        assetsBySku.get(key).push(rest);
    }

    const data = result.data.map((sku) => ({
        ...sku,
        assets: assetsBySku.get(sku._id.toString()) || [],
    }));

    return { data, pagination: result.pagination };
};

module.exports = { searchAssetsFuzzy, searchSkusFuzzy, searchSkusFuzzyWithAssets };
