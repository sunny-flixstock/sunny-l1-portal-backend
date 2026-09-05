const router = require('express').Router();
const { digitalizedFundus } = require('../controllers/CustomReport');
const customReportValidation = require('../validations/customReport.validation');

router.get('/digitalizedFundus', customReportValidation.digitalizedFundus, digitalizedFundus);

module.exports = router;
