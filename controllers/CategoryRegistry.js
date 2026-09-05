const {
    listCategoryRegistries,
    getCategoryRegistryById,
    createCategoryRegistry,
    deleteCategoryRegistry,
} = require('../services/categoryRegistry.service');

const getCategoryRegistries = async (req, res, next) => {
    try {
        const result = await listCategoryRegistries(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getCategoryRegistry = async (req, res, next) => {
    try {
        const doc = await getCategoryRegistryById(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const postCategoryRegistry = async (req, res, next) => {
    try {
        const doc = await createCategoryRegistry(req.body);
        return res.status(201).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const removeCategoryRegistry = async (req, res, next) => {
    try {
        const doc = await deleteCategoryRegistry(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getCategoryRegistries,
    getCategoryRegistry,
    postCategoryRegistry,
    removeCategoryRegistry,
};
