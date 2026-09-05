const router = require('express').Router();
const {
    getFrameworkVocabs,
    getFrameworkVocab,
    postFrameworkVocab,
    removeFrameworkVocab,
} = require('../controllers/FrameworkVocab');
const frameworkVocabValidation = require('../validations/frameworkVocab.validation');

router.get('/', frameworkVocabValidation.listFrameworkVocabs, getFrameworkVocabs);
router.get('/:id', frameworkVocabValidation.getFrameworkVocab, getFrameworkVocab);
router.post('/', frameworkVocabValidation.createFrameworkVocab, postFrameworkVocab);
router.delete('/:id', frameworkVocabValidation.deleteFrameworkVocab, removeFrameworkVocab);

module.exports = router;
