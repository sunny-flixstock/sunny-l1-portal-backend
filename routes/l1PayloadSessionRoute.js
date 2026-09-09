const router = require('express').Router();
const {
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
} = require('../controllers/L1PayloadSession');
const l1PayloadSessionValidation = require('../validations/l1PayloadSession.validation');
const payloadUpload = require('../middlewares/payloadUpload');

router.post('/', payloadUpload, postPayloadSession);
router.get('/', getPayloadSessionList);
// Scoped to Payload Creation only -- clears L1PayloadSession/L1PayloadFile,
// never touches ground-truth documents/versions or RCA batches/traces.
router.delete('/', deleteAllPayloadSessions);
router.get('/:id', l1PayloadSessionValidation.getPayloadSession, getPayloadSession);
router.get('/:id/files', l1PayloadSessionValidation.getPayloadSession, getPayloadSessionFiles);
router.get('/:id/files/content', l1PayloadSessionValidation.getPayloadSession, getPayloadSessionFilesWithContent);
router.get('/:id/download', l1PayloadSessionValidation.getPayloadSession, downloadPayloadSessionZip);
router.get('/:id/feedback-items', l1PayloadSessionValidation.getPayloadSession, getFeedbackItems);
router.post('/:id/feedback-items/verify', l1PayloadSessionValidation.postVerifyFeedbackItem, postVerifyFeedbackItem);
// Pure visibility/analysis artifact -- deliberately unrelated to RCA or SKU
// config upload (see l1FeedbackDeck.service's doc comment). One slide per
// merged feedback item, generated on demand from the session's current
// mergedItems each time this is called.
router.get('/:id/feedback-deck', l1PayloadSessionValidation.getPayloadSession, downloadFeedbackDeck);

module.exports = router;
