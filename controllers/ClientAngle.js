const {
    listClientAngles,
    listAllClientAngles,
    listClientAngleVersions,
    getClientAngleById,
    presignClientAngleUploads,
    generateClientAngle,
    reviseClientAngleDefinition,
    updateClientAngleName,
    archiveClientAngle,
    getClientAngleMetadata,
} = require('../services/clientAngle.service');

const getClientAngles = async (req, res, next) => {
    try {
        const result = await listClientAngles(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getAllClientAngles = async (req, res, next) => {
    try {
        const result = await listAllClientAngles(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getClientAngleVersions = async (req, res, next) => {
    try {
        const data = await listClientAngleVersions(req.params.seriesKey);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getClientAngle = async (req, res, next) => {
    try {
        const includeContent = req.query.includeContent === 'true';
        const data = await getClientAngleById(req.params.id, { includeContent });
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getClientAnglesMeta = async (req, res, next) => {
    try {
        return res.status(200).json({ data: getClientAngleMetadata() });
    } catch (err) {
        next(err);
    }
};

const postPresignClientAngleUploads = async (req, res, next) => {
    try {
        const data = await presignClientAngleUploads(req.body);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postGenerateClientAngle = async (req, res, next) => {
    try {
        const data = await generateClientAngle(req.body);
        return res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};

const postReviseClientAngleDefinition = async (req, res, next) => {
    try {
        const data = await reviseClientAngleDefinition(req.body);
        return res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};

const patchClientAngleName = async (req, res, next) => {
    try {
        const data = await updateClientAngleName(req.params.id, req.body.name);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postArchiveClientAngle = async (req, res, next) => {
    try {
        const data = await archiveClientAngle(req.params.id);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getClientAngles,
    getAllClientAngles,
    getClientAngleVersions,
    getClientAngle,
    getClientAnglesMeta,
    postPresignClientAngleUploads,
    postGenerateClientAngle,
    postReviseClientAngleDefinition,
    patchClientAngleName,
    postArchiveClientAngle,
};
