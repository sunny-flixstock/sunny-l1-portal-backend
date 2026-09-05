const {
    listAnglePresets,
    getAnglePresetById,
    createAnglePreset,
    updateAnglePreset,
    deleteAnglePreset,
} = require('../services/anglePreset.service');

const getAnglePresets = async (req, res, next) => {
    try {
        const result = await listAnglePresets(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getAnglePreset = async (req, res, next) => {
    try {
        const doc = await getAnglePresetById(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const postAnglePreset = async (req, res, next) => {
    try {
        const doc = await createAnglePreset(req.body);
        return res.status(201).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const patchAnglePreset = async (req, res, next) => {
    try {
        const doc = await updateAnglePreset(req.params.id, req.body);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const removeAnglePreset = async (req, res, next) => {
    try {
        const doc = await deleteAnglePreset(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAnglePresets,
    getAnglePreset,
    postAnglePreset,
    patchAnglePreset,
    removeAnglePreset,
};
