const router = require('express').Router();
const {
    getAllClients,
    getClients,
    getClient,
    postClient,
    postBulkClients,
    patchEnableFXGTOM,
    patchCsvConfig,
} = require('../controllers/Client');
const clientValidation = require('../validations/client.validation');
const { apiKeyAuth } = require('../middlewares/apiKeyAuth');

router.get('/', clientValidation.getClients, getClients);
router.get('/all', clientValidation.listAllClients, getAllClients);
router.post('/', clientValidation.createClient, postClient);
router.post('/bulk', apiKeyAuth, clientValidation.bulkCreateClients, postBulkClients);
router.get('/:code', clientValidation.getClient, getClient);
router.patch('/:code/enableFXGTOM', apiKeyAuth, clientValidation.patchEnableFXGTOM, patchEnableFXGTOM);
router.patch('/:code/csvConfig', clientValidation.patchCsvConfig, patchCsvConfig);

module.exports = router;
