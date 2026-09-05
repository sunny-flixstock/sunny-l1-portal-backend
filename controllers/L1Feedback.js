const l1FeedbackBatchService = require('../services/l1FeedbackBatch.service');
const l1HitlReviewService = require('../services/l1HitlReview.service');

const postBatch = async (req, res, next) => {
    try {
        const data = await l1FeedbackBatchService.createBatchAndProcess(req.body);
        res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};

const getBatches = async (req, res, next) => {
    try {
        const data = await l1FeedbackBatchService.listBatches();
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getBatch = async (req, res, next) => {
    try {
        const data = await l1FeedbackBatchService.getBatchById(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getBatchDetail = async (req, res, next) => {
    try {
        const data = await l1FeedbackBatchService.getBatchDetail(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getIssues = async (req, res, next) => {
    try {
        const skuIds = req.query.skuIds ? String(req.query.skuIds).split(',').filter(Boolean) : undefined;
        const data = await l1HitlReviewService.listOpenIssues({ skuIds });
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postIssueDecision = async (req, res, next) => {
    try {
        const data = await l1HitlReviewService.submitDecision(req.body);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    postBatch,
    getBatches,
    getBatch,
    getBatchDetail,
    getIssues,
    postIssueDecision,
};
