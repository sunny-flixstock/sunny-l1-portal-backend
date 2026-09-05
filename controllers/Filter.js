const FilterModel = require('../models/Filter.model');
const { searchFilterValues } = require('../services/filter.service');

const getFilters = async (req, res, next) => {
    try {
        const filters = await FilterModel.getForClient(req.query.clientName);
        return res.status(200).json({ data: filters });
    } catch (err) {
        next(err);
    }
};

const searchValues = async (req, res, next) => {
    try {
        const { clientName, key, q, pageNum, pageSize } = req.query;
        const result = await searchFilterValues({ clientName, key, q, pageNum, pageSize });
        return res.status(200).json({ data: result });
    } catch (err) {
        next(err);
    }
};

module.exports = { getFilters, searchValues };
