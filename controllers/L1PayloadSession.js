const l1PayloadSessionService = require('../services/l1PayloadSession.service');
const Api400Error = require('../errors/api400Error');

// multipart/form-data -- not celebrate-validated (multipart bodies aren't
// expressible that way); validated directly here instead, same pattern as
// L1GenericFeedback's postGenericFeedbackZip.
const postPayloadSession = async (req, res, next) => {
    try {
        const documents = req.files?.documents ?? [];
        const feedbackDocFile = req.files?.feedbackDoc?.[0];
        if (!documents.length) {
            throw new Api400Error('documents[] (raw <skuId>.json files) is required');
        }
        if (!feedbackDocFile) {
            throw new Api400Error('feedbackDoc (a .pptx or .docx file) is required');
        }

        const data = await l1PayloadSessionService.createPayloadSession({
            rawFiles: documents,
            docBuffer: feedbackDocFile.buffer,
            docName: feedbackDocFile.originalname,
            date: req.body?.date,
            createdBy: req.body?.createdBy,
        });
        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};

const getPayloadSession = async (req, res, next) => {
    try {
        const data = await l1PayloadSessionService.getPayloadSessionById(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getPayloadSessionFiles = async (req, res, next) => {
    try {
        const data = await l1PayloadSessionService.listPayloadSessionFiles(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getPayloadSessionFilesWithContent = async (req, res, next) => {
    try {
        const data = await l1PayloadSessionService.getPayloadSessionFilesWithContent(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const downloadPayloadSessionZip = async (req, res, next) => {
    try {
        await l1PayloadSessionService.streamPayloadSessionZip(req.params.id, res);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    postPayloadSession,
    getPayloadSession,
    getPayloadSessionFiles,
    getPayloadSessionFilesWithContent,
    downloadPayloadSessionZip,
};
