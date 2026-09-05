const router = require('express').Router();
const { getPartnerFramework } = require('../controllers/PartnerFramework');
const partnerFrameworkValidation = require('../validations/partnerFramework.validation');
const { apiKeyAuth } = require('../middlewares/apiKeyAuth');

router.get('/', apiKeyAuth, partnerFrameworkValidation.getPartnerFramework, getPartnerFramework);

module.exports = router;
