const router = require('express').Router();
const { getPartnerAnglePresets } = require('../controllers/PartnerAnglePreset');
const partnerAnglePresetValidation = require('../validations/partnerAnglePreset.validation');
const { apiKeyAuth } = require('../middlewares/apiKeyAuth');

router.get('/', apiKeyAuth, partnerAnglePresetValidation.listPartnerAnglePresets, getPartnerAnglePresets);

module.exports = router;
