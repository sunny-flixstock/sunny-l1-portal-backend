const router = require('express').Router();
const { postBatch, getBatches, getBatch, getBatchDetail, getIssues, postIssueDecision } = require('../controllers/L1Feedback');
const l1FeedbackValidation = require('../validations/l1Feedback.validation');

router.post('/batches', l1FeedbackValidation.createBatch, postBatch);
router.get('/batches', getBatches);
router.get('/batches/:id', l1FeedbackValidation.getBatch, getBatch);
router.get('/batches/:id/detail', l1FeedbackValidation.getBatchDetail, getBatchDetail);
router.get('/issues', l1FeedbackValidation.getIssues, getIssues);
router.post('/issues/decision', l1FeedbackValidation.postIssueDecision, postIssueDecision);

module.exports = router;
