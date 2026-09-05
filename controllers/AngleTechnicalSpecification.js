const {
    listAngleTechnicalSpecifications,
    getAngleTechnicalSpecificationById,
    createAngleTechnicalSpecification,
    deleteAngleTechnicalSpecification,
    getAngleTechnicalSpecificationMeta,
} = require('../services/angleTechnicalSpecification.service');

const getAngleTechnicalSpecifications = async (req, res, next) => {
    try {
        const result = await listAngleTechnicalSpecifications(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getAngleTechnicalSpecification = async (req, res, next) => {
    try {
        const doc = await getAngleTechnicalSpecificationById(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const postAngleTechnicalSpecification = async (req, res, next) => {
    try {
        const doc = await createAngleTechnicalSpecification(req.body);
        const status = doc.deduplicated ? 200 : 201;
        return res.status(status).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const removeAngleTechnicalSpecification = async (req, res, next) => {
    try {
        const doc = await deleteAngleTechnicalSpecification(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const getAngleTechnicalSpecificationMetaHandler = async (req, res, next) => {
    try {
        return res.status(200).json({ data: getAngleTechnicalSpecificationMeta() });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAngleTechnicalSpecifications,
    getAngleTechnicalSpecification,
    postAngleTechnicalSpecification,
    removeAngleTechnicalSpecification,
    getAngleTechnicalSpecificationMetaHandler,
};
