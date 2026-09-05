const svc = require('../services/descriptionModel.service');
const { searchByFaceImage } = require('../services/descriptionModelImageEmbedding/descriptionModelImageSearch.service');

// ── DescriptionModel ───────────────────────────────────────────────────────

const postDescriptionModel = async (req, res, next) => {
    try {
        const doc = await svc.createDescriptionModel(req.body);
        return res.status(201).json({ data: doc });
    } catch (err) { next(err); }
};

const getDescriptionModels = async (req, res, next) => {
    try {
        const result = await svc.listDescriptionModels(req.query);
        return res.status(200).json(result);
    } catch (err) { next(err); }
};

const getDescriptionModel = async (req, res, next) => {
    try {
        const doc = await svc.getDescriptionModelByIdentity(req.params.modelIdentity);
        return res.status(200).json({ data: doc });
    } catch (err) { next(err); }
};

const putDescriptionModel = async (req, res, next) => {
    try {
        const doc = await svc.updateDescriptionModel(req.params.modelIdentity, req.body);
        return res.status(200).json({ data: doc });
    } catch (err) { next(err); }
};

const toggleDescriptionModelVisibility = async (req, res, next) => {
    try {
        const doc = await svc.toggleDescriptionModelVisibility(req.params.modelIdentity, req.body.isActive);
        return res.status(200).json({ data: doc });
    } catch (err) { next(err); }
};

// ── DescriptionModelImage ──────────────────────────────────────────────────

const postPresignModelImageUpload = async (req, res, next) => {
    try {
        const data = await svc.presignModelImageUpload(req.body);
        return res.status(200).json({ data });
    } catch (err) { next(err); }
};

const postDescriptionModelImage = async (req, res, next) => {
    try {
        const doc = await svc.createDescriptionModelImage(req.body);
        return res.status(201).json({ data: doc });
    } catch (err) { next(err); }
};

const getDescriptionModelImages = async (req, res, next) => {
    try {
        const result = await svc.listDescriptionModelImages(req.query);
        return res.status(200).json(result);
    } catch (err) { next(err); }
};

const putDescriptionModelImage = async (req, res, next) => {
    try {
        const doc = await svc.updateDescriptionModelImage(req.params.id, req.body);
        return res.status(200).json({ data: doc });
    } catch (err) { next(err); }
};

const toggleDescriptionModelImageVisibility = async (req, res, next) => {
    try {
        const doc = await svc.toggleDescriptionModelImageVisibility(req.params.id, req.body.isActive);
        return res.status(200).json({ data: doc });
    } catch (err) { next(err); }
};

const postPresignSearchImageUpload = async (req, res, next) => {
    try {
        const data = await svc.presignSearchImageUpload(req.body);
        return res.status(200).json({ data });
    } catch (err) { next(err); }
};

const postSearchByFaceImage = async (req, res, next) => {
    try {
        const { imageKey, bucket = 'fxgati', modelIdentities, pageNum, pageSize } = req.body;
        const result = await searchByFaceImage({ bucket, imageKey, modelIdentities, pageNum, pageSize });
        return res.status(200).json(result);
    } catch (err) { next(err); }
};

module.exports = {
    postDescriptionModel,
    getDescriptionModels,
    getDescriptionModel,
    putDescriptionModel,
    toggleDescriptionModelVisibility,
    postPresignModelImageUpload,
    postDescriptionModelImage,
    getDescriptionModelImages,
    putDescriptionModelImage,
    toggleDescriptionModelImageVisibility,
    postPresignSearchImageUpload,
    postSearchByFaceImage,
};
