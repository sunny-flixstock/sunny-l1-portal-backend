const router = require('express').Router();
const { postBatch, getBatches, getBatch, getBatchDetail, getIssues, postIssueDecision, postAutoRun } = require('../controllers/L1Feedback');
const l1FeedbackValidation = require('../validations/l1Feedback.validation');

router.post('/batches', l1FeedbackValidation.createBatch, postBatch);
router.get('/batches', getBatches);
router.get('/batches/:id', l1FeedbackValidation.getBatch, getBatch);
router.get('/batches/:id/detail', l1FeedbackValidation.getBatchDetail, getBatchDetail);
router.get('/issues', l1FeedbackValidation.getIssues, getIssues);
router.post('/issues/decision', l1FeedbackValidation.postIssueDecision, postIssueDecision);
// One-click BZT Sports pipeline: fetches the window's reworked SKUs from
// Phoenix, builds a Payload Creation session, and immediately hands it to
// the same createBatchAndProcess batch pipeline /batches above uses.
router.post('/auto-run', l1FeedbackValidation.postAutoRun, postAutoRun);

module.exports = router;
