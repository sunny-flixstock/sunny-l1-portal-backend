const {
    listExampleImages,
    listDistinctTags,
    getExampleImageById,
    presignExampleImageUploads,
    createExampleImage,
    updateExampleImage,
    batchUpdateExampleImages,
    getThumbnailStatus,
    deleteExampleImage,
    getExampleImageMetadata,
} = require('../services/exampleImage.service');

const getExampleImages = async (req, res, next) => {
    try {
        const result = await listExampleImages(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getExampleImageTags = async (req, res, next) => {
    try {
        const tags = await listDistinctTags(req.query.client);
        return res.status(200).json({ data: tags });
    } catch (err) {
        next(err);
    }
};

const getExampleImageMeta = async (req, res, next) => {
    try {
        return res.status(200).json({ data: getExampleImageMetadata() });
    } catch (err) {
        next(err);
    }
};

const getExampleImage = async (req, res, next) => {
    try {
        const doc = await getExampleImageById(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const postPresignUploads = async (req, res, next) => {
    try {
        const data = await presignExampleImageUploads(req.body);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postExampleImage = async (req, res, next) => {
    try {
        const doc = await createExampleImage(req.body);
        return res.status(201).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const putExampleImage = async (req, res, next) => {
    try {
        const doc = await updateExampleImage(req.params.id, req.body);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

const patchExampleImagesBatch = async (req, res, next) => {
    try {
        const data = await batchUpdateExampleImages(req.body.updates);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postThumbnailStatus = async (req, res, next) => {
    try {
        const data = await getThumbnailStatus(req.body.ids);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const removeExampleImage = async (req, res, next) => {
    try {
        const doc = await deleteExampleImage(req.params.id);
        return res.status(200).json({ data: doc });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getExampleImages,
    getExampleImageTags,
    getExampleImageMeta,
    getExampleImage,
    postPresignUploads,
    postExampleImage,
    putExampleImage,
    patchExampleImagesBatch,
    postThumbnailStatus,
    removeExampleImage,
};
