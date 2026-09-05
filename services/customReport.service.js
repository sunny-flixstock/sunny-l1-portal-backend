const SkuModel = require('../models/Sku.model');
const AssetModel = require('../models/Asset.model');
const { completeImageObject } = require('../utils/completeImageObject');
const { EXCLUDE_DAR_SCAN_SHOOT_TYPE } = require('../utils/filterValues');
const { INTERNAL_CLIENT_NAME } = require('../config');

const READ_PREFERENCE = 'secondaryPreferred';

const toScalarPatternDict = (patternDict) => {
    if (!patternDict || typeof patternDict !== 'object') return {};
    const out = {};
    for (const [key, value] of Object.entries(patternDict)) {
        if (value instanceof Date) {
            out[key] = value.toISOString();
            continue;
        }
        if (Array.isArray(value)) continue;
        if (value !== null && typeof value === 'object') continue;
        out[key] = value;
    }
    return out;
};

const buildDigitalizedFundusFilter = ({ clientName, patternDictFilter, includeInternal = false }) => {
    const filter = {
        isActive: true,
        shouldNotProduce: { $ne: true },
        ...EXCLUDE_DAR_SCAN_SHOOT_TYPE,
    };

    if (includeInternal && clientName !== INTERNAL_CLIENT_NAME) {
        filter.$or = [
            { clientName },
            { clientName: INTERNAL_CLIENT_NAME, associatedTo: clientName },
        ];
    } else {
        filter.clientName = clientName;
    }

    if (patternDictFilter && typeof patternDictFilter === 'object') {
        for (const [k, v] of Object.entries(patternDictFilter)) {
            filter[`patternDict.${k}`] = Array.isArray(v) ? { $in: v } : v;
        }
    }

    return filter;
};

const attachDisplayAssets = async (skus) => {
    if (!skus.length) return;

    const skuIds = skus.map((s) => s._id);
    const assetGroups = await AssetModel.aggregate([
        { $match: { skuId: { $in: skuIds }, isActive: true, shouldNotProduce: { $ne: true } } },
        { $sort: { createdAt: 1 } },
        {
            $group: {
                _id: '$skuId',
                image: { $first: '$image' },
            },
        },
    ]).read(READ_PREFERENCE);

    const assetBySkuId = new Map(assetGroups.map((g) => [g._id.toString(), g]));
    skus.forEach((sku) => {
        const asset = assetBySkuId.get(sku._id.toString());
        const image = asset?.image || null;
        if (image) completeImageObject(image);
        sku.imageUrl = image?.imagePath?.url || null;
        sku.thumbUrl = image?.thumbPath?.url || null;
    });
};

const getDigitalizedFundusReport = async ({ clientName, patternDictFilter, includeInternal }) => {
    const filter = buildDigitalizedFundusFilter({ clientName, patternDictFilter, includeInternal });
    const projection = { barcode: 1, clientName: 1, patternDict: 1 };

    const data = [];
    const cursor = SkuModel.find(filter, projection)
        .sort({ createdAt: -1 })
        .read(READ_PREFERENCE)
        .lean()
        .cursor();

    for await (const sku of cursor) {
        sku.patternDict = toScalarPatternDict(sku.patternDict);
        data.push(sku);
    }

    await attachDisplayAssets(data);

    return { data, total: data.length };
};

module.exports = { getDigitalizedFundusReport };
