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
} = require('../controllers/L1PayloadSession');
const l1PayloadSessionValidation = require('../validations/l1PayloadSession.validation');
const payloadUpload = require('../middlewares/payloadUpload');

router.post('/', payloadUpload, postPayloadSession);
router.get('/', getPayloadSessionList);
router.get('/:id', l1PayloadSessionValidation.getPayloadSession, getPayloadSession);
router.get('/:id/files', l1PayloadSessionValidation.getPayloadSession, getPayloadSessionFiles);
router.get('/:id/files/content', l1PayloadSessionValidation.getPayloadSession, getPayloadSessionFilesWithContent);
router.get('/:id/download', l1PayloadSessionValidation.getPayloadSession, downloadPayloadSessionZip);
router.get('/:id/feedback-items', l1PayloadSessionValidation.getPayloadSession, getFeedbackItems);
router.post('/:id/feedback-items/verify', l1PayloadSessionValidation.postVerifyFeedbackItem, postVerifyFeedbackItem);

module.exports = router;
