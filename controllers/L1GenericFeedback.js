const l1GenericFeedbackService = require('../services/l1GenericFeedback.service');

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
    postGenericFeedback,
    getGenericFeedbackList,
    getGenericFeedbackById,
    postGenericFeedbackDecision,
};
