const router = require('express').Router();
const {
    getAnglePresets,
    getAnglePreset,
    postAnglePreset,
    patchAnglePreset,
    removeAnglePreset,
} = require('../controllers/AnglePreset');
const anglePresetValidation = require('../validations/anglePreset.validation');

router.get('/', anglePresetValidation.listAnglePresets, getAnglePresets);
router.get('/:id', anglePresetValidation.getAnglePreset, getAnglePreset);
router.post('/', anglePresetValidation.createAnglePreset, postAnglePreset);
router.patch('/:id', anglePresetValidation.updateAnglePreset, patchAnglePreset);
router.delete('/:id', anglePresetValidation.deleteAnglePreset, removeAnglePreset);

module.exports = router;
