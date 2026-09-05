const mime = require('mime-types');
const l1GenericFeedbackService = require('../services/l1GenericFeedback.service');
const { getS3PreSignedpath } = require('../services/amazonS3Service');
const { S3_BUCKET } = require('../config');

// Same pre-signed-PUT pattern as controllers/Asset.js's getUploadUrl, own
// key prefix -- these images aren't part of the asset catalog.
const getUploadUrl = async (req, res, next) => {
    try {
        const { fileName } = req.query;
        const key = `l1GenericFeedback/${Date.now()}_${fileName}`;
        const contentType = mime.lookup(fileName) || 'image/jpeg';
        const { url } = await getS3PreSignedpath(key, contentType, S3_BUCKET);
        return res.status(200).json({ key, url, contentType });
    } catch (err) {
        next(err);
    }
};

const postGenericFeedback = async (req, res, next) => {
    try {
        const data = await l1GenericFeedbackService.submitGenericFeedback(req.body);
        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};

const getGenericFeedbackList = async (req, res, next) => {
    try {
        const data = await l1GenericFeedbackService.listGenericFeedbackRequests();
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getGenericFeedbackById = async (req, res, next) => {
    try {
        const data = await l1GenericFeedbackService.getGenericFeedbackRequestById(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postGenericFeedbackDecision = async (req, res, next) => {
    try {
        const data = await l1GenericFeedbackService.submitGenericFeedbackDecision({
            requestId: req.params.id,
            ...req.body,
        });
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getUploadUrl,
    postGenericFeedback,
    getGenericFeedbackList,
    getGenericFeedbackById,
    postGenericFeedbackDecision,
};
