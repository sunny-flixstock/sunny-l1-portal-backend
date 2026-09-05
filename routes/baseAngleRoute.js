const router = require('express').Router();
const {
    getBaseAngles,
    getBaseAngleVersions,
    getBaseAngle,
    getBaseAnglesMeta,
    postPresignBaseAngleUploads,
    postBaseAngle,
    patchBaseAngleName,
    postArchiveBaseAngle,
} = require('../controllers/BaseAngle');
const baseAngleValidation = require('../validations/baseAngle.validation');

router.get('/meta', getBaseAnglesMeta);
router.get('/', baseAngleValidation.listBaseAngles, getBaseAngles);
router.post('/presign', baseAngleValidation.presignUploads, postPresignBaseAngleUploads);
router.get(
    '/series/:seriesKey/versions',
    baseAngleValidation.getBaseAngleVersions,
    getBaseAngleVersions
);
router.post('/:id/archive', baseAngleValidation.archiveBaseAngle, postArchiveBaseAngle);
router.patch('/:id/name', baseAngleValidation.patchBaseAngleName, patchBaseAngleName);
router.get('/:id', baseAngleValidation.getBaseAngle, getBaseAngle);
router.post('/', baseAngleValidation.createBaseAngle, postBaseAngle);

module.exports = router;
