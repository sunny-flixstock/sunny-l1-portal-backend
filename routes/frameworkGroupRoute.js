const router = require('express').Router();
const {
    getFrameworkGroups,
    getFrameworkGroup,
    postFrameworkGroup,
    putFrameworkGroup,
    removeFrameworkGroup,
} = require('../controllers/FrameworkGroup');
const frameworkGroupValidation = require('../validations/frameworkGroup.validation');

router.get('/', frameworkGroupValidation.listFrameworkGroups, getFrameworkGroups);
router.get('/:id', frameworkGroupValidation.getFrameworkGroup, getFrameworkGroup);
router.post('/', frameworkGroupValidation.createFrameworkGroup, postFrameworkGroup);
router.put('/:id', frameworkGroupValidation.updateFrameworkGroup, putFrameworkGroup);
router.delete('/:id', frameworkGroupValidation.deleteFrameworkGroup, removeFrameworkGroup);

module.exports = router;
