const router = require('express').Router();
const upload = require('../middlewares/multerUpload');
const { importCsv, search, getStatsByClient, getById, getByClientAndBarcode, lookupByClientAndBarcode, semanticSearchPartner, doNotProduce, saveCsvData, aggregate } = require('../controllers/Sku');
const skuValidation = require('../validations/sku.validation');
const { apiKeyAuth } = require('../middlewares/apiKeyAuth');

router.get('/statsByClient', skuValidation.statsByClient, getStatsByClient);
router.post('/aggregate', apiKeyAuth, skuValidation.aggregate, aggregate);
router.get('/semanticSearchPartner', apiKeyAuth, skuValidation.search, semanticSearchPartner);
router.get('/', skuValidation.search, search);
router.get('/byClientAndBarcode', apiKeyAuth, skuValidation.getByClientAndBarcode, getByClientAndBarcode);
router.get('/lookupByClientAndBarcode', skuValidation.getByClientAndBarcode, lookupByClientAndBarcode);
router.get('/:id', skuValidation.getById, getById);
router.post('/importCsv', upload.single('file'), skuValidation.importCsv, importCsv);
router.post('/doNotProduce', skuValidation.doNotProduce, doNotProduce);
router.post('/saveCsvData', skuValidation.saveCsvData, saveCsvData);

module.exports = router;
