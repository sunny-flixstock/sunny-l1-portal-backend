const router = require('express').Router();
const ctrl = require('../controllers/DescriptionModel');
const v = require('../validations/descriptionModel.validation');
const { apiKeyAuth } = require('../middlewares/apiKeyAuth');

// ── Search ─────────────────────────────────────────────────────────────────
router.post('/search/presign', apiKeyAuth, v.presignSearchImageUpload, ctrl.postPresignSearchImageUpload);
router.post('/search', apiKeyAuth, v.searchByFaceImage, ctrl.postSearchByFaceImage);

// ── DescriptionModelImage (must be before /:modelIdentity to avoid param collision) ──
router.get('/image/list', apiKeyAuth, v.listDescriptionModelImages, ctrl.getDescriptionModelImages);
router.post('/image/presign', apiKeyAuth, v.presignModelImageUpload, ctrl.postPresignModelImageUpload);
router.post('/image', apiKeyAuth, v.createDescriptionModelImage, ctrl.postDescriptionModelImage);
router.put('/image/:id', apiKeyAuth, v.updateDescriptionModelImage, ctrl.putDescriptionModelImage);
router.patch('/image/:id/visibility', apiKeyAuth, v.toggleVisibility, ctrl.toggleDescriptionModelImageVisibility);

// ── DescriptionModel ───────────────────────────────────────────────────────
router.get('/', apiKeyAuth, v.listDescriptionModels, ctrl.getDescriptionModels);
router.get('/:modelIdentity', apiKeyAuth, v.getDescriptionModel, ctrl.getDescriptionModel);
router.post('/', apiKeyAuth, v.createDescriptionModel, ctrl.postDescriptionModel);
router.put('/:modelIdentity', apiKeyAuth, v.updateDescriptionModel, ctrl.putDescriptionModel);
router.patch('/:modelIdentity/visibility', apiKeyAuth, v.toggleVisibility, ctrl.toggleDescriptionModelVisibility);

module.exports = router;
