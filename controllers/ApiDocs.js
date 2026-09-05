const { listApiDocs, getApiDoc } = require('../services/apiDocs.service');

const getApiDocs = async (req, res, next) => {
    try {
        const result = await listApiDocs();
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getApiDocByName = async (req, res, next) => {
    try {
        const result = await getApiDoc(req.params.name);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getApiDocs,
    getApiDocByName,
};
