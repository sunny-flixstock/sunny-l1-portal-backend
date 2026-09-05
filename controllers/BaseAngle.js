const {
    listBaseAngles,
    listBaseAngleVersions,
    getBaseAngleById,
    presignBaseAngleUploads,
    createBaseAngle,
    updateBaseAngleName,
    archiveBaseAngle,
    getBaseAngleMetadata,
} = require('../services/baseAngle.service');

const getBaseAngles = async (req, res, next) => {
    try {
        const result = await listBaseAngles(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getBaseAngleVersions = async (req, res, next) => {
    try {
        const data = await listBaseAngleVersions(req.params.seriesKey);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getBaseAngle = async (req, res, next) => {
    try {
        const includeContent = req.query.includeContent === 'true';
        const data = await getBaseAngleById(req.params.id, { includeContent });
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getBaseAnglesMeta = async (req, res, next) => {
    try {
        return res.status(200).json({ data: getBaseAngleMetadata() });
    } catch (err) {
        next(err);
    }
};

const postPresignBaseAngleUploads = async (req, res, next) => {
    try {
        const data = await presignBaseAngleUploads(req.body);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postBaseAngle = async (req, res, next) => {
    try {
        const data = await createBaseAngle(req.body);
        return res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};

const patchBaseAngleName = async (req, res, next) => {
    try {
        const data = await updateBaseAngleName(req.params.id, req.body.name);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postArchiveBaseAngle = async (req, res, next) => {
    try {
        const data = await archiveBaseAngle(req.params.id);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getBaseAngles,
    getBaseAngleVersions,
    getBaseAngle,
    getBaseAnglesMeta,
    postPresignBaseAngleUploads,
    postBaseAngle,
    patchBaseAngleName,
    postArchiveBaseAngle,
};
