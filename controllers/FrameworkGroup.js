const {
    listFrameworkGroups,
    getFrameworkGroupById,
    createFrameworkGroup,
    updateFrameworkGroup,
    deleteFrameworkGroup,
} = require('../services/frameworkGroup.service');

const getFrameworkGroups = async (req, res, next) => {
    try {
        const result = await listFrameworkGroups(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getFrameworkGroup = async (req, res, next) => {
    try {
        const group = await getFrameworkGroupById(req.params.id);
        return res.status(200).json({ data: group });
    } catch (err) {
        next(err);
    }
};

const postFrameworkGroup = async (req, res, next) => {
    try {
        const group = await createFrameworkGroup(req.body);
        return res.status(201).json({ data: group });
    } catch (err) {
        next(err);
    }
};

const putFrameworkGroup = async (req, res, next) => {
    try {
        const group = await updateFrameworkGroup(req.params.id, req.body);
        return res.status(200).json({ data: group });
    } catch (err) {
        next(err);
    }
};

const removeFrameworkGroup = async (req, res, next) => {
    try {
        const group = await deleteFrameworkGroup(req.params.id);
        return res.status(200).json({ data: group });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getFrameworkGroups,
    getFrameworkGroup,
    postFrameworkGroup,
    putFrameworkGroup,
    removeFrameworkGroup,
};
