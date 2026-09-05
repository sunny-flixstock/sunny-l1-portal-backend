const router = require('express').Router();
const { getFilters, searchValues } = require('../controllers/Filter');
const filterValidation = require('../validations/filter.validation');

router.get('/', filterValidation.getFilters, getFilters);
router.get('/searchValues', filterValidation.searchValues, searchValues);

module.exports = router;
