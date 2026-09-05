const SkuModel = require('../models/Sku.model');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');

const MAX_SCAN = 2000;

const searchFilterValues = async ({ clientName, key, q, pageNum, pageSize }) => {
    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const field = `patternDict.${key}`;

    const query = {
        clientName,
        shouldNotProduce: { $ne: true },
        [field]: { $regex: escapeRegex(q), $options: 'i' },
    };

    const docs = await SkuModel.find(query, { [field]: 1, _id: 0 }).limit(MAX_SCAN).lean();

    const set = new Set();
    for (const d of docs) {
        const v = d.patternDict && d.patternDict[key];
        if (v === null || v === undefined || v === '') continue;
        set.add(String(v));
    }

    const all = [...set].sort();
    return {
        values: all.slice(skip, skip + limit),
        total: all.length,
        scanCapped: docs.length === MAX_SCAN,
    };
};

module.exports = { searchFilterValues };
