const router = require('express').Router();
const {
    postPayloadSession,
    getPayloadSession,
    getPayloadSessionFiles,
    getPayloadSessionFilesWithContent,
    downloadPayloadSessionZip,
} = require('../controllers/L1PayloadSession');
const l1PayloadSessionValidation = require('../validations/l1PayloadSession.validation');
const payloadUpload = require('../middlewares/payloadUpload');

router.post('/', payloadUpload, postPayloadSession);
router.get('/:id', l1PayloadSessionValidation.getPayloadSession, getPayloadSession);
router.get('/:id/files', l1PayloadSessionValidation.getPayloadSession, getPayloadSessionFiles);
router.get('/:id/files/content', l1PayloadSessionValidation.getPayloadSession, getPayloadSessionFilesWithContent);
router.get('/:id/download', l1PayloadSessionValidation.getPayloadSession, downloadPayloadSessionZip);

module.exports = router;
