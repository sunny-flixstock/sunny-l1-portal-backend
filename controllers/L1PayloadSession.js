const l1PayloadSessionService = require('../services/l1PayloadSession.service');
const { buildFeedbackDeckPptx } = require('../services/l1FeedbackDeck.service');
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

const getPayloadSessionList = async (req, res, next) => {
    try {
        const data = await l1PayloadSessionService.listPayloadSessions();
        res.status(200).json({ data });
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

const getFeedbackItems = async (req, res, next) => {
    try {
        const data = await l1PayloadSessionService.listFeedbackItems(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postVerifyFeedbackItem = async (req, res, next) => {
    try {
        const { skuId, itemIndex, status, verifiedBy } = req.body;
        const data = await l1PayloadSessionService.verifyFeedbackItem(req.params.id, skuId, itemIndex, {
            status,
            verifiedBy,
        });
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const downloadFeedbackDeck = async (req, res, next) => {
    try {
        const { buffer, filename } = await buildFeedbackDeckPptx(req.params.id);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (err) {
        next(err);
    }
};

const deleteAllPayloadSessions = async (req, res, next) => {
    try {
        const data = await l1PayloadSessionService.clearAllPayloadSessions();
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    postPayloadSession,
    getPayloadSessionList,
    getPayloadSession,
    getPayloadSessionFiles,
    getPayloadSessionFilesWithContent,
    downloadPayloadSessionZip,
    getFeedbackItems,
    postVerifyFeedbackItem,
    downloadFeedbackDeck,
    deleteAllPayloadSessions,
};
