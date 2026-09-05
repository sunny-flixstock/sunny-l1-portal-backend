const router = require('express').Router();
const { getUploadUrl, getInternalAssetUploadUrls, create, createWithProperties, search, semanticSearch, semanticSearchPartner, updateAssetUsageCounter } = require('../controllers/Asset');
const assetValidation = require('../validations/asset.validation');
const { apiKeyAuth } = require('../middlewares/apiKeyAuth');

router.get('/getUploadUrl', assetValidation.getUploadUrl, getUploadUrl);
router.post('/internalAssetUploadUrls', assetValidation.getInternalAssetUploadUrls, getInternalAssetUploadUrls);
router.post('/create', assetValidation.create, create);
router.post('/createWithProperties', assetValidation.createWithProperties, createWithProperties);
router.get('/semanticSearch', assetValidation.search, semanticSearch);
router.get('/semanticSearchPartner', apiKeyAuth, assetValidation.search, semanticSearchPartner);
router.get('/', assetValidation.search, search);
router.patch('/updateAssetUsageCounter', assetValidation.updateAssetUsageCounter, updateAssetUsageCounter);

module.exports = router;
