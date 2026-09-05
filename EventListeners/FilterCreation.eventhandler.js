const FilterModel = require('../models/Filter.model');
const SkuModel = require('../models/Sku.model');

const onFilterUpdate = async ({ skuId, clientName, patternDict }) => {
    const ops = Object.entries(patternDict)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([key, value]) => FilterModel.addValue(clientName, key, String(value)));
    await Promise.all(ops);
    await SkuModel.findByIdAndUpdate(skuId, { filtersSynced: true });
};

module.exports = { onFilterUpdate };
