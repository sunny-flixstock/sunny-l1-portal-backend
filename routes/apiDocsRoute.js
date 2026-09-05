const router = require('express').Router();
const { getApiDocs, getApiDocByName } = require('../controllers/ApiDocs');
const apiDocsValidation = require('../validations/apiDocs.validation');

router.get('/', getApiDocs);
router.get('/:name', apiDocsValidation.getApiDocByName, getApiDocByName);

module.exports = router;
