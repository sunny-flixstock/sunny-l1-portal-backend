const router = require('express').Router();
const {
    getInputSets,
    getInputSet,
    postInputSet,
    putInputSet,
    removeInputSet,
} = require('../controllers/InputSet');
const inputSetValidation = require('../validations/inputSet.validation');

router.get('/', inputSetValidation.listInputSets, getInputSets);
router.get('/:id', inputSetValidation.getInputSet, getInputSet);
router.post('/', inputSetValidation.createInputSet, postInputSet);
router.put('/:id', inputSetValidation.updateInputSet, putInputSet);
router.delete('/:id', inputSetValidation.deleteInputSet, removeInputSet);

module.exports = router;
