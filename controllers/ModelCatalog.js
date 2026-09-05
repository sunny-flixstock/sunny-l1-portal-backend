const { getDescriptionModelCatalog } = require('../services/modelCatalog.service');

const getDescriptionModels = async (req, res, next) => {
    try {
        return res.status(200).json({ data: getDescriptionModelCatalog() });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDescriptionModels,
};
