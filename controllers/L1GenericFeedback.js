const l1GenericFeedbackService = require('../services/l1GenericFeedback.service');
const Api400Error = require('../errors/api400Error');

const postGenericFeedback = async (req, res, next) => {
    try {
        const data = await l1GenericFeedbackService.submitGenericFeedback(req.body);
        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};

// multipart/form-data -- a deliberate, scoped exception to this project's
// "never multer" mandate (see CLAUDE.md #4), which exists because the
// original app has real S3 to offload large uploads to. This personal
// fork has none by design; multer's in-memory buffer is the pragmatic
// choice for a 30-40MB zip that's extracted and discarded immediately.
// Not celebrate-validated (multipart bodies aren't expressible that way);
// validated directly here instead.
const postGenericFeedbackZip = async (req, res, next) => {
    try {
        if (!req.body?.text?.trim()) {
            throw new Api400Error('text is required');
        }
        if (!req.file) {
            throw new Api400Error('bundle file is required');
        }
        const data = await l1GenericFeedbackService.submitZipFeedback({
            zipBuffer: req.file.buffer,
            text: req.body.text,
            createdBy: req.body.createdBy,
        });
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
    postGenericFeedback,
    postGenericFeedbackZip,
    getGenericFeedbackList,
    getGenericFeedbackById,
    postGenericFeedbackDecision,
};
