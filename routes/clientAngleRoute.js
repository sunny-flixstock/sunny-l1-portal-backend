const router = require('express').Router();
const {
    getClientAngles,
    getAllClientAngles,
    getClientAngleVersions,
    getClientAngle,
    getClientAnglesMeta,
    postPresignClientAngleUploads,
    postGenerateClientAngle,
    postReviseClientAngleDefinition,
    patchClientAngleName,
    postArchiveClientAngle,
} = require('../controllers/ClientAngle');
const clientAngleValidation = require('../validations/clientAngle.validation');
const { apiKeyAuth } = require('../middlewares/apiKeyAuth');

router.get('/meta', getClientAnglesMeta);
router.get('/all', apiKeyAuth, clientAngleValidation.listAllClientAngles, getAllClientAngles);
router.get('/', clientAngleValidation.listClientAngles, getClientAngles);
router.post('/presign', clientAngleValidation.presignUploads, postPresignClientAngleUploads);
router.post('/generate', clientAngleValidation.generateClientAngle, postGenerateClientAngle);
router.post(
    '/',
    clientAngleValidation.reviseClientAngleDefinition,
    postReviseClientAngleDefinition
);
router.get(
    '/series/:seriesKey/versions',
    clientAngleValidation.getClientAngleVersions,
    getClientAngleVersions
);
router.post('/:id/archive', clientAngleValidation.archiveClientAngle, postArchiveClientAngle);
router.patch('/:id/name', clientAngleValidation.patchClientAngleName, patchClientAngleName);
router.get('/:id', clientAngleValidation.getClientAngle, getClientAngle);

module.exports = router;
