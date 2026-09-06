const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const L1GroundTruthDocumentModel = require('../models/L1GroundTruthDocument.model');
const L1GroundTruthVersionModel = require('../models/L1GroundTruthVersion.model');
const L1FeedbackBatchModel = require('../models/L1FeedbackBatch.model');
const L1SkuTraceModel = require('../models/L1SkuTrace.model');
const L1GenericFeedbackRequestModel = require('../models/L1GenericFeedbackRequest.model');
const Api400Error = require('../errors/api400Error');

// L1_Feedback_Skill/ lives inside this repo (copied in for the standalone
// personal-portal deployment, which doesn't have the original monorepo's
// sibling directory available).
const SOURCE_ROOT = path.resolve(__dirname, '..', 'L1_Feedback_Skill');

// The skill/feature is scoped to a single client today -- traces don't
// carry an explicit client field (see rca_generic_schema.json), so this is
// the one place that assumption is declared, shared by every module that
// needs it, to keep it easy to find if/when a second client is added.
const DEFAULT_CLIENT = 'BZT';

// Seed definitions for client BZT -- the 4 gendered core files + 4
// ungendered angle files the l1-feedback skill already references.
const SEED_DOCS = [
    { client: 'BZT', gender: 'male', docKey: 'styling', fileName: 'BZT_Male_Sports_Styling_PROD.md' },
    { client: 'BZT', gender: 'male', docKey: 'posing', fileName: 'BZT_Male_Sports_Posing_PROD.md' },
    { client: 'BZT', gender: 'female', docKey: 'styling', fileName: 'BZT_Female_Sports_Styling_PROD.md' },
    { client: 'BZT', gender: 'female', docKey: 'posing', fileName: 'BZT_Female_Sports_Posing_PROD.md' },
    { client: 'BZT', gender: null, docKey: 'FULL_FRONT', fileName: 'BZT_FULL_FRONT_SPORTS.md' },
    { client: 'BZT', gender: null, docKey: 'FRONT_UPPER_CROP', fileName: 'BZT_FRONT_UPPER_CROP_SPORTS.md' },
    { client: 'BZT', gender: null, docKey: 'FULL_BACK', fileName: 'BZT_FULL_BACK_SPORTS.md' },
    { client: 'BZT', gender: null, docKey: 'FRONT_LOWER_CROP', fileName: 'BZT_FRONT_LOWER__CROP_SPORTS.md' },
];

/** Idempotent: creates the 8 ground-truth documents (and their version 1,
 * both staging and live pointing at it) from the on-disk originals the
 * l1-feedback skill already uses, if they don't already exist. */
const seedGroundTruthDocuments = async () => {
    const created = [];
    for (const def of SEED_DOCS) {
        const existing = await L1GroundTruthDocumentModel.findOne({
            client: def.client,
            gender: def.gender,
            docKey: def.docKey,
        }).lean();
        if (existing) {
            continue;
        }

        const filePath = path.join(SOURCE_ROOT, def.fileName);
        const content = fs.readFileSync(filePath, 'utf8');

        const doc = await L1GroundTruthDocumentModel.create({
            client: def.client,
            gender: def.gender,
            docKey: def.docKey,
            fileName: def.fileName,
        });

        const version = await L1GroundTruthVersionModel.create({
            documentId: doc._id,
            versionNumber: 1,
            content,
            batchId: null,
            appliedFixes: [],
            createdBy: 'seed',
        });

        doc.stagingVersionId = version._id;
        doc.liveVersionId = version._id;
        await doc.save();

        created.push(doc.fileName);
    }
    return { created };
};

const enrichDocument = async (doc) => {
    const [staging, live] = await Promise.all([
        doc.stagingVersionId
            ? L1GroundTruthVersionModel.findById(doc.stagingVersionId).select({ versionNumber: 1 }).lean()
            : null,
        doc.liveVersionId
            ? L1GroundTruthVersionModel.findById(doc.liveVersionId).select({ versionNumber: 1 }).lean()
            : null,
    ]);

    return {
        _id: doc._id,
        client: doc.client,
        gender: doc.gender,
        docKey: doc.docKey,
        fileName: doc.fileName,
        stagingVersionId: doc.stagingVersionId,
        liveVersionId: doc.liveVersionId,
        stagingVersionNumber: staging?.versionNumber ?? null,
        liveVersionNumber: live?.versionNumber ?? null,
        hasPendingStagingChanges:
            doc.stagingVersionId != null &&
            String(doc.stagingVersionId) !== String(doc.liveVersionId ?? ''),
        updatedAt: doc.updatedAt,
    };
};

const listGroundTruthDocuments = async ({ client } = {}) => {
    const filter = {};
    if (client) {
        filter.client = client;
    }
    const docs = await L1GroundTruthDocumentModel.find(filter).sort({ gender: 1, docKey: 1 }).lean();
    return Promise.all(docs.map(enrichDocument));
};

const getGroundTruthDocumentById = async (documentId) => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new Api400Error('Invalid document id');
    }
    const doc = await L1GroundTruthDocumentModel.findById(documentId).lean();
    if (!doc) {
        throw new Api400Error(`Ground-truth document not found: ${documentId}`);
    }
    return enrichDocument(doc);
};

const listVersionsForDocument = async (documentId) => {
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
        throw new Api400Error('Invalid document id');
    }
    const doc = await L1GroundTruthDocumentModel.findById(documentId).lean();
    if (!doc) {
        throw new Api400Error(`Ground-truth document not found: ${documentId}`);
    }
    const versions = await L1GroundTruthVersionModel.find({ documentId })
        .select({ content: 0 })
        .sort({ versionNumber: -1 })
        .lean();

    return versions.map((v) => ({
        ...v,
        isStaging: String(doc.stagingVersionId ?? '') === String(v._id),
        isLive: String(doc.liveVersionId ?? '') === String(v._id),
    }));
};

const getVersionContent = async (versionId) => {
    if (!mongoose.Types.ObjectId.isValid(versionId)) {
        throw new Api400Error('Invalid version id');
    }
    const version = await L1GroundTruthVersionModel.findById(versionId).lean();
    if (!version) {
        throw new Api400Error(`Ground-truth version not found: ${versionId}`);
    }
    return version;
};

const promoteVersionToLive = async (documentId, versionId) => {
    if (!mongoose.Types.ObjectId.isValid(documentId) || !mongoose.Types.ObjectId.isValid(versionId)) {
        throw new Api400Error('Invalid document or version id');
    }
    const doc = await L1GroundTruthDocumentModel.findById(documentId);
    if (!doc) {
        throw new Api400Error(`Ground-truth document not found: ${documentId}`);
    }
    const version = await L1GroundTruthVersionModel.findOne({ _id: versionId, documentId }).lean();
    if (!version) {
        throw new Api400Error(`Version ${versionId} does not belong to document ${documentId}`);
    }

    doc.liveVersionId = version._id;
    // Promoting a version also settles staging on it -- there is nothing
    // "pending" once the version you just made live already existed.
    doc.stagingVersionId = version._id;
    await doc.save();

    return enrichDocument(doc.toObject());
};

const ANGLE_DOC_KEYS = ['FULL_FRONT', 'FRONT_UPPER_CROP', 'FULL_BACK', 'FRONT_LOWER_CROP'];

/** Match a SKU's own angle name (e.g. "BZT_FULL_FRONT_SPORTS") against one
 * of the 4 ungendered angle docKeys, or null if it isn't one of ours. */
const matchAngleDocKey = (angleName) =>
    ANGLE_DOC_KEYS.find((key) => (angleName || '').toUpperCase().includes(key)) ?? null;

/** Resolve which L1GroundTruthDocument a variant's RCA `concernedFile`
 * points at, given the SKU's gender. `concernedFile` values follow the
 * skill's convention: "stylingMd (...)" / "posingMd (...)" / an angle
 * definition URL/name, or "prompt-composition" (never resolvable here). */
const resolveDocumentForConcernedFile = async ({ client, gender, concernedFile, angleName }) => {
    const normalized = String(concernedFile ?? '').toLowerCase();
    let docKey = null;
    let docGender = gender;

    if (normalized.startsWith('stylingmd')) {
        docKey = 'styling';
    } else if (normalized.startsWith('posingmd')) {
        docKey = 'posing';
    } else if (normalized === 'prompt-composition') {
        return null;
    } else {
        // Angle definition file -- match against the SKU's own angle name
        // for this variant (angle files are ungendered).
        const angleKeyMatch = matchAngleDocKey(angleName);
        if (!angleKeyMatch) {
            return null;
        }
        docKey = angleKeyMatch;
        docGender = null;
    }

    const doc = await L1GroundTruthDocumentModel.findOne({ client, gender: docGender, docKey });
    return doc;
};

/** Live reference for one (client, gender, docKey) -- used at ingestion
 * time to attach an authoritative pointer onto a SKU's trace instead of
 * trusting whatever the raw uploaded config claims. Returns null if the
 * document hasn't been seeded yet (caller decides the fallback). */
const resolveLiveReference = async ({ client, gender, docKey }) => {
    const doc = await L1GroundTruthDocumentModel.findOne({ client, gender, docKey }).lean();
    if (!doc?.liveVersionId) {
        return null;
    }
    const liveVersion = await L1GroundTruthVersionModel.findById(doc.liveVersionId)
        .select({ versionNumber: 1 })
        .lean();
    if (!liveVersion) {
        return null;
    }
    return {
        ref: doc.fileName,
        groundTruthDocumentId: doc._id,
        versionNumber: liveVersion.versionNumber,
    };
};

/** Live reference for a SKU angle's ground-truth doc, by angle name. Null
 * if the angle name doesn't match one of the 4 known angle docKeys, or the
 * doc hasn't been seeded yet. */
const resolveLiveAngleReference = async ({ client, angleName }) => {
    const docKey = matchAngleDocKey(angleName);
    if (!docKey) {
        return null;
    }
    return resolveLiveReference({ client, gender: null, docKey });
};

/** The CURRENT live content for a document, fetched fresh by its id --
 * used at RCA time so diagnosis always compares against whatever is
 * actually in production right now, not whatever was live back when the
 * SKU was first ingested (staging edits from other batches in between
 * never leak into diagnosis this way either). Null if the document or its
 * live version no longer exists. */
const getLiveContentByDocumentId = async (documentId) => {
    if (!documentId) {
        return null;
    }
    const doc = await L1GroundTruthDocumentModel.findById(documentId).lean();
    if (!doc?.liveVersionId) {
        return null;
    }
    const liveVersion = await L1GroundTruthVersionModel.findById(doc.liveVersionId)
        .select({ content: 1, versionNumber: 1 })
        .lean();
    if (!liveVersion) {
        return null;
    }
    return { fileName: doc.fileName, versionNumber: liveVersion.versionNumber, content: liveVersion.content };
};

/** Get this batch's staging version for a document, creating a new one
 * (copied from the current staging content) if this batch hasn't already
 * created one for it -- same idempotency as framework_snapshot.py's
 * same-day `new` behavior. */
const getOrCreateBatchStagingVersion = async (doc, batchId) => {
    const currentStagingId = doc.stagingVersionId ?? doc.liveVersionId;
    if (!currentStagingId) {
        throw new Error(`document ${doc._id} has no content to branch a staging version from`);
    }
    const currentStaging = await L1GroundTruthVersionModel.findById(currentStagingId).lean();

    if (currentStaging.batchId && String(currentStaging.batchId) === String(batchId)) {
        // This batch already created a staging version for this doc --
        // reuse it so multiple fixes in one run stack instead of
        // clobbering each other.
        return L1GroundTruthVersionModel.findById(currentStaging._id);
    }

    const latestVersionNumber = await L1GroundTruthVersionModel.find({ documentId: doc._id })
        .sort({ versionNumber: -1 })
        .limit(1)
        .select({ versionNumber: 1 })
        .lean();
    const nextVersionNumber = (latestVersionNumber[0]?.versionNumber ?? 0) + 1;

    const newVersion = await L1GroundTruthVersionModel.create({
        documentId: doc._id,
        versionNumber: nextVersionNumber,
        content: currentStaging.content,
        batchId,
        appliedFixes: [],
    });

    doc.stagingVersionId = newVersion._id;
    await doc.save();

    return newVersion;
};

/** The current live content of every ground-truth document for a client,
 * keyed by fileName -- used by Generic Feedback, which (unlike per-SKU RCA)
 * doesn't start from a trace that already narrows down which files are
 * relevant, so it needs the full set to route free-text/image feedback
 * against. */
const getAllLiveContents = async (client = DEFAULT_CLIENT) => {
    const docs = await L1GroundTruthDocumentModel.find({ client }).lean();
    const entries = await Promise.all(
        docs.map(async (doc) => {
            if (!doc.liveVersionId) return null;
            const live = await L1GroundTruthVersionModel.findById(doc.liveVersionId)
                .select({ content: 1, versionNumber: 1 })
                .lean();
            if (!live) return null;
            return [
                doc.fileName,
                {
                    documentId: doc._id,
                    gender: doc.gender,
                    docKey: doc.docKey,
                    versionNumber: live.versionNumber,
                    content: live.content,
                },
            ];
        })
    );
    return Object.fromEntries(entries.filter(Boolean));
};

/** Full "clean slate" reset for local/dev use: every ground-truth document
 * is collapsed back to a single version 1 built from whatever its Live
 * content currently is (Live is the source of truth), with Staging and Live
 * both pointing at that new v1 -- discarding every other version so no old
 * test edit can resurface via a stale staging pointer. Per an explicit
 * product decision, this also wipes L1FeedbackBatch / L1SkuTrace /
 * L1GenericFeedbackRequest entirely so Session History starts empty
 * alongside the clean framework baseline. Irreversible; local/dev only. */
const resetToCleanBaseline = async () => {
    const docs = await L1GroundTruthDocumentModel.find({});
    const resetDocs = [];

    for (const doc of docs) {
        const liveId = doc.liveVersionId ?? doc.stagingVersionId;
        if (!liveId) continue; // never seeded -- nothing to reset

        const liveVersion = await L1GroundTruthVersionModel.findById(liveId).lean();
        if (!liveVersion) continue;

        await L1GroundTruthVersionModel.deleteMany({ documentId: doc._id });
        const v1 = await L1GroundTruthVersionModel.create({
            documentId: doc._id,
            versionNumber: 1,
            content: liveVersion.content,
            batchId: null,
            appliedFixes: [],
            createdBy: 'reset',
        });

        doc.stagingVersionId = v1._id;
        doc.liveVersionId = v1._id;
        await doc.save();
        resetDocs.push(doc.fileName);
    }

    const [batchesDeleted, tracesDeleted, genericDeleted] = await Promise.all([
        L1FeedbackBatchModel.deleteMany({}),
        L1SkuTraceModel.deleteMany({}),
        L1GenericFeedbackRequestModel.deleteMany({}),
    ]);

    return {
        resetDocuments: resetDocs,
        batchesDeleted: batchesDeleted.deletedCount,
        tracesDeleted: tracesDeleted.deletedCount,
        genericFeedbackDeleted: genericDeleted.deletedCount,
    };
};

module.exports = {
    DEFAULT_CLIENT,
    seedGroundTruthDocuments,
    listGroundTruthDocuments,
    getGroundTruthDocumentById,
    listVersionsForDocument,
    getVersionContent,
    promoteVersionToLive,
    resolveDocumentForConcernedFile,
    resolveLiveReference,
    resolveLiveAngleReference,
    getLiveContentByDocumentId,
    getAllLiveContents,
    getOrCreateBatchStagingVersion,
    resetToCleanBaseline,
};
