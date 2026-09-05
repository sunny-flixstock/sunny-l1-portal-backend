const DescriptionModel = require('../models/DescriptionModel.model');
const DescriptionModelImage = require('../models/DescriptionModelImage.model');
const { getS3PreSignedpath } = require('./amazonS3Service');
const { S3_BUCKET } = require('../config');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');

// ── DescriptionModel CRUD ──────────────────────────────────────────────────

const createDescriptionModel = async (body) => {
    try {
        const doc = await DescriptionModel.create(body);
        return doc;
    } catch (err) {
        if (err.code === 11000) throw new Api400Error(`A model with identity "${body.modelIdentity}" already exists`);
        throw err;
    }
};

const listDescriptionModels = async ({ pageNum = 1, pageSize = 20 } = {}) => {
    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const [data, total] = await Promise.all([
        DescriptionModel.find({ isActive: true }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        DescriptionModel.countDocuments({ isActive: true }),
    ]);
    return { data, total, pageNum, pageSize };
};

const getDescriptionModelByIdentity = async (modelIdentity) => {
    const doc = await DescriptionModel.findOne({ modelIdentity, isActive: true });
    if (!doc) throw new Api400Error('DescriptionModel not found');
    return doc;
};

const updateDescriptionModel = async (modelIdentity, body) => {
    const doc = await DescriptionModel.findOneAndUpdate({ modelIdentity, isActive: true }, body, { new: true, runValidators: true });
    if (!doc) throw new Api400Error('DescriptionModel not found');
    return doc;
};

const toggleDescriptionModelVisibility = async (modelIdentity, isActive) => {
    const doc = await DescriptionModel.findOneAndUpdate({ modelIdentity }, { isActive }, { new: true });
    if (!doc) throw new Api400Error('DescriptionModel not found');
    return doc;
};

// ── DescriptionModelImage CRUD ─────────────────────────────────────────────

const createDescriptionModelImage = async ({ modelIdentity, originalImageKey, cropImageKey, cropLocation }) => {
    const exists = await DescriptionModel.exists({ modelIdentity, isActive: true });
    if (!exists) throw new Api400Error(`No active DescriptionModel found for modelIdentity: ${modelIdentity}`);
    const doc = await DescriptionModelImage.create({
        modelIdentity,
        cropLocation,
        originalImage: { imagePath: { key: originalImageKey } },
        croppedImage: { imagePath: { key: cropImageKey } },
    });
    global.eventEmitter.emitSafe('description-model-image-embedding-sync', { docId: doc._id.toString() });
    return doc;
};

const listDescriptionModelImages = async ({ modelIdentity, pageNum = 1, pageSize = 20 } = {}) => {
    const filter = { isActive: true, ...(modelIdentity ? { modelIdentity } : {}) };
    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const [data, total] = await Promise.all([
        DescriptionModelImage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        DescriptionModelImage.countDocuments(filter),
    ]);
    return { data, total, pageNum, pageSize };
};

const updateDescriptionModelImage = async (id, { originalImageKey, cropImageKey, cropLocation }) => {
    const doc = await DescriptionModelImage.findOne({ _id: id, isActive: true });
    if (!doc) throw new Api400Error('DescriptionModelImage not found');
    if (originalImageKey) doc.originalImage = { imagePath: { key: originalImageKey } };
    if (cropImageKey) {
        doc.croppedImage = { imagePath: { key: cropImageKey } };
        doc.embeddingDone = false;
    }
    if (cropLocation) doc.cropLocation = cropLocation;
    await doc.save();
    if (cropImageKey) global.eventEmitter.emitSafe('description-model-image-embedding-sync', { docId: doc._id.toString() });
    return doc;
};

const toggleDescriptionModelImageVisibility = async (id, isActive) => {
    const doc = await DescriptionModelImage.findByIdAndUpdate(id, { isActive }, { new: true });
    if (!doc) throw new Api400Error('DescriptionModelImage not found');
    return doc;
};

// ── Pre-signed upload URL ──────────────────────────────────────────────────

const IMAGE_UPLOAD_TYPES = ['original', 'cropped'];

const presignModelImageUpload = async ({ modelIdentity, fileName, type }) => {
    const ext = path.extname(fileName);
    const key = `descriptionModelReferences/${modelIdentity}/${type}/${uuidv4()}${ext}`;
    const { url } = await getS3PreSignedpath(key, 'image/jpeg', S3_BUCKET);
    return { key, url, bucket: S3_BUCKET };
};

const presignSearchImageUpload = async ({ fileName }) => {
    const ext = path.extname(fileName);
    const date = new Date().toISOString().slice(0, 10);
    const key = `descriptionModelReferences/search/${date}/${uuidv4()}${ext}`;
    const { url } = await getS3PreSignedpath(key, 'image/jpeg', S3_BUCKET);
    return { key, url, bucket: S3_BUCKET };
};

module.exports = {
    createDescriptionModel,
    listDescriptionModels,
    getDescriptionModelByIdentity,
    updateDescriptionModel,
    toggleDescriptionModelVisibility,
    createDescriptionModelImage,
    listDescriptionModelImages,
    updateDescriptionModelImage,
    toggleDescriptionModelImageVisibility,
    IMAGE_UPLOAD_TYPES,
    presignModelImageUpload,
    presignSearchImageUpload,
};
