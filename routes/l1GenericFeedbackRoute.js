const router = require('express').Router();
const {
    postGenericFeedback,
    postGenericFeedbackZip,
    getGenericFeedbackList,
    getGenericFeedbackById,
    postGenericFeedbackDecision,
    deleteGenericFeedback,
} = require('../controllers/L1GenericFeedback');
const l1GenericFeedbackValidation = require('../validations/l1GenericFeedback.validation');
const zipUpload = require('../middlewares/zipUpload');

router.post('/', l1GenericFeedbackValidation.postGenericFeedback, postGenericFeedback);
router.post('/zip', zipUpload.single('bundle'), postGenericFeedbackZip);
router.get('/', getGenericFeedbackList);
router.get('/:id', l1GenericFeedbackValidation.getGenericFeedbackById, getGenericFeedbackById);
router.post('/:id/decision', l1GenericFeedbackValidation.postGenericFeedbackDecision, postGenericFeedbackDecision);
router.delete('/:id', l1GenericFeedbackValidation.getGenericFeedbackById, deleteGenericFeedback);

module.exports = router;
