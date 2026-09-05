const {
    listFrameworkVocabs,
    getFrameworkVocabById,
    createFrameworkVocab,
    deleteFrameworkVocab,
} = require('../services/frameworkVocab.service');

const getFrameworkVocabs = async (req, res, next) => {
    try {
        const result = await listFrameworkVocabs(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getFrameworkVocab = async (req, res, next) => {
    try {
        const doc = await getFrameworkVocabById(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const postFrameworkVocab = async (req, res, next) => {
    try {
        const doc = await createFrameworkVocab(req.body);
        return res.status(201).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const removeFrameworkVocab = async (req, res, next) => {
    try {
        const doc = await deleteFrameworkVocab(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getFrameworkVocabs,
    getFrameworkVocab,
    postFrameworkVocab,
    removeFrameworkVocab,
};
