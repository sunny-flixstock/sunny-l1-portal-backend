const router = require('express').Router();
const {
    getInstructionTypes,
    getSystemInstructionsMeta,
    getSystemInstructions,
    getSystemInstruction,
    postSystemInstruction,
    patchSystemInstructionName,
    removeSystemInstruction,
} = require('../controllers/SystemInstruction');
const systemInstructionValidation = require('../validations/systemInstruction.validation');

router.get('/types', getInstructionTypes);
router.get('/meta', getSystemInstructionsMeta);
router.get('/', systemInstructionValidation.listSystemInstructions, getSystemInstructions);
router.get(
    '/:id',
    systemInstructionValidation.getSystemInstruction,
    getSystemInstruction
);
router.post('/', systemInstructionValidation.createSystemInstruction, postSystemInstruction);
router.patch(
    '/:id/name',
    systemInstructionValidation.patchSystemInstructionName,
    patchSystemInstructionName
);
router.delete(
    '/:id',
    systemInstructionValidation.deleteSystemInstruction,
    removeSystemInstruction
);

module.exports = router;
