const router = require('express').Router();
const { health } = require('../controllers/Health');

router.get('/', health);

module.exports = router;
