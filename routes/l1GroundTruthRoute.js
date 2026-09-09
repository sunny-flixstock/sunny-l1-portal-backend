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
    postResetGroundTruthToCleanV1,
    postAdvanceStagingVersion,
    postAdvanceStagingVersionBulk,
} = require('../controllers/L1GroundTruth');
const l1GroundTruthValidation = require('../validations/l1GroundTruth.validation');

// Local/dev convenience -- not client-facing, no auth by mandate #10's
// "explicitly public" carve-out for internal setup endpoints.
router.post('/seed', postSeedGroundTruthDocuments);
// Destructive local/dev reset -- irreversible, gated on { confirm: true }
// rather than auth (same convenience carve-out as /seed above).
router.post('/reset', l1GroundTruthValidation.resetToCleanBaseline, postResetToCleanBaseline);
// Narrower, non-destructive reset scoped to all 8 ground-truth docs --
// collapses stacked test/real staging versions back to a clean v1 from the
// real production .md files, without touching feedback/batch history (see
// resetGroundTruthToCleanV1's doc comment). Gated the same way.
router.post(
    '/reset-ground-truth-v1',
    l1GroundTruthValidation.resetGroundTruthToCleanV1,
    postResetGroundTruthToCleanV1
);

// Manually seals the current staging draft into its own permanent version
// number and opens a fresh draft at the same content -- approvals never
// advance the version number themselves (see getOrCreateDraftStagingVersion's
// doc comment); this is the only thing that does. Bulk variant covers the
// common case of one run touching several documents at once, skipping any
// document with nothing pending rather than erroring on it.
router.post('/advance-staging-bulk', l1GroundTruthValidation.advanceStagingVersionBulk, postAdvanceStagingVersionBulk);

router.get('/', l1GroundTruthValidation.listGroundTruthDocuments, getGroundTruthDocuments);
router.get('/versions/:versionId', l1GroundTruthValidation.getGroundTruthVersionContent, getGroundTruthVersionContent);
router.get('/:id/versions', l1GroundTruthValidation.getGroundTruthVersions, getGroundTruthVersions);
router.post('/:id/promote', l1GroundTruthValidation.promoteGroundTruthVersion, postPromoteGroundTruthVersion);
router.post('/:id/advance-staging', l1GroundTruthValidation.advanceStagingVersion, postAdvanceStagingVersion);
// Overwrites live+staging content with an out-of-band copy (e.g. the real
// current production styling.md/posing.md) -- this fork's copy is a
// point-in-time seed and never tracks edits made on the real partner
// framework. Behind the global sessionAuth like everything else here.
router.post('/:id/refresh-content', l1GroundTruthValidation.refreshGroundTruthContent, postRefreshGroundTruthContent);
router.get('/:id', l1GroundTruthValidation.getGroundTruthDocument, getGroundTruthDocument);

module.exports = router;
