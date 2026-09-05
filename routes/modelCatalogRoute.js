const router = require('express').Router();
const { getDescriptionModels } = require('../controllers/ModelCatalog');

router.get('/description', getDescriptionModels);

module.exports = router;
