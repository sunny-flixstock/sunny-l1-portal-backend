const router = require('express').Router();
const {
    getUploadUrl,
    postGenericFeedback,
    getGenericFeedbackList,
    getGenericFeedbackById,
    postGenericFeedbackDecision,
} = require('../controllers/L1GenericFeedback');
const l1GenericFeedbackValidation = require('../validations/l1GenericFeedback.validation');

router.get('/getUploadUrl', l1GenericFeedbackValidation.getUploadUrl, getUploadUrl);
router.post('/', l1GenericFeedbackValidation.postGenericFeedback, postGenericFeedback);
router.get('/', getGenericFeedbackList);
router.get('/:id', l1GenericFeedbackValidation.getGenericFeedbackById, getGenericFeedbackById);
router.post('/:id/decision', l1GenericFeedbackValidation.postGenericFeedbackDecision, postGenericFeedbackDecision);

module.exports = router;
