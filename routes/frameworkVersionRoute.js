const router = require('express').Router();
const {
    getFrameworkVersions,
    getFrameworkVersion,
    postFrameworkVersion,
    postStartFrameworkCreation,
    getFrameworkVersionDescriptions,
    patchFrameworkVersionDomainDescription,
    postArchiveFrameworkVersion,
    postMakeFrameworkVersionLive,
    demoteToInReview,
} = require('../controllers/FrameworkVersion');
const frameworkVersionValidation = require('../validations/frameworkVersion.validation');

router.get('/', frameworkVersionValidation.listFrameworkVersions, getFrameworkVersions);
router.post(
    '/:id/start-creation',
    frameworkVersionValidation.startFrameworkCreation,
    postStartFrameworkCreation
);
router.get(
    '/:id/domain-descriptions',
    frameworkVersionValidation.getFrameworkVersionDomainDescriptions,
    getFrameworkVersionDescriptions
);
router.patch(
    '/:id/domain-descriptions/:domain',
    frameworkVersionValidation.updateFrameworkVersionDomainDescription,
    patchFrameworkVersionDomainDescription
);
router.post(
    '/:id/archive',
    frameworkVersionValidation.archiveFrameworkVersion,
    postArchiveFrameworkVersion
);
router.post(
    '/:id/make-live',
    frameworkVersionValidation.makeFrameworkVersionLive,
    postMakeFrameworkVersionLive
);
router.post(
    '/:id/demote-to-in-review',
    frameworkVersionValidation.demoteToInReview,
    demoteToInReview
);
router.get('/:id', frameworkVersionValidation.getFrameworkVersion, getFrameworkVersion);
router.post('/', frameworkVersionValidation.createFrameworkVersion, postFrameworkVersion);

module.exports = router;
