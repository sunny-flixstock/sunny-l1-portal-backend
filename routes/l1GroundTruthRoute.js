const router = require('express').Router();
const {
    getGroundTruthDocuments,
    getGroundTruthDocument,
    getGroundTruthVersions,
    getGroundTruthVersionContent,
    postPromoteGroundTruthVersion,
    postSeedGroundTruthDocuments,
    postResetToCleanBaseline,
    postRefreshGroundTruthContent,
    postResetStylingPosingToCleanV1,
} = require('../controllers/L1GroundTruth');
const l1GroundTruthValidation = require('../validations/l1GroundTruth.validation');

// Local/dev convenience -- not client-facing, no auth by mandate #10's
// "explicitly public" carve-out for internal setup endpoints.
router.post('/seed', postSeedGroundTruthDocuments);
// Destructive local/dev reset -- irreversible, gated on { confirm: true }
// rather than auth (same convenience carve-out as /seed above).
router.post('/reset', l1GroundTruthValidation.resetToCleanBaseline, postResetToCleanBaseline);
// Narrower, non-destructive reset scoped to just the 4 styling/posing docs
// -- collapses stacked test/real staging versions back to a clean v1 from
// the real production .md files, without touching feedback/batch history
// (see resetStylingPosingToCleanV1's doc comment). Gated the same way.
router.post(
    '/reset-styling-posing-v1',
    l1GroundTruthValidation.resetStylingPosingToCleanV1,
    postResetStylingPosingToCleanV1
);

router.get('/', l1GroundTruthValidation.listGroundTruthDocuments, getGroundTruthDocuments);
router.get('/versions/:versionId', l1GroundTruthValidation.getGroundTruthVersionContent, getGroundTruthVersionContent);
router.get('/:id/versions', l1GroundTruthValidation.getGroundTruthVersions, getGroundTruthVersions);
router.post('/:id/promote', l1GroundTruthValidation.promoteGroundTruthVersion, postPromoteGroundTruthVersion);
// Overwrites live+staging content with an out-of-band copy (e.g. the real
// current production styling.md/posing.md) -- this fork's copy is a
// point-in-time seed and never tracks edits made on the real partner
// framework. Behind the global sessionAuth like everything else here.
router.post('/:id/refresh-content', l1GroundTruthValidation.refreshGroundTruthContent, postRefreshGroundTruthContent);
router.get('/:id', l1GroundTruthValidation.getGroundTruthDocument, getGroundTruthDocument);

module.exports = router;
