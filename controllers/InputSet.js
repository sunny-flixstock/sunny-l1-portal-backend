const {
    listInputSets,
    getInputSetById,
    createInputSet,
    updateInputSet,
    archiveInputSet,
} = require('../services/inputSet.service');

const getInputSets = async (req, res, next) => {
    try {
        const result = await listInputSets(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getInputSet = async (req, res, next) => {
    try {
        const inputSet = await getInputSetById(req.params.id);
        return res.status(200).json({ data: inputSet });
    } catch (err) {
        next(err);
    }
};

const postInputSet = async (req, res, next) => {
    try {
        const inputSet = await createInputSet(req.body);
        return res.status(201).json({ data: inputSet });
    } catch (err) {
        next(err);
    }
};

const putInputSet = async (req, res, next) => {
    try {
        const inputSet = await updateInputSet(req.params.id, req.body);
        return res.status(200).json({ data: inputSet });
    } catch (err) {
        next(err);
    }
};

const removeInputSet = async (req, res, next) => {
    try {
        const inputSet = await archiveInputSet(req.params.id);
        return res.status(200).json({ data: inputSet });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getInputSets,
    getInputSet,
    postInputSet,
    putInputSet,
    removeInputSet,
};
