const l1GroundTruthService = require('../services/l1GroundTruth.service');

const getGroundTruthDocuments = async (req, res, next) => {
    try {
        const data = await l1GroundTruthService.listGroundTruthDocuments(req.query);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getGroundTruthDocument = async (req, res, next) => {
    try {
        const data = await l1GroundTruthService.getGroundTruthDocumentById(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getGroundTruthVersions = async (req, res, next) => {
    try {
        const data = await l1GroundTruthService.listVersionsForDocument(req.params.id);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getGroundTruthVersionContent = async (req, res, next) => {
    try {
        const data = await l1GroundTruthService.getVersionContent(req.params.versionId);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postPromoteGroundTruthVersion = async (req, res, next) => {
    try {
        const data = await l1GroundTruthService.promoteVersionToLive(req.params.id, req.body.versionId);
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postSeedGroundTruthDocuments = async (req, res, next) => {
    try {
        const data = await l1GroundTruthService.seedGroundTruthDocuments();
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const postResetToCleanBaseline = async (req, res, next) => {
    try {
        const data = await l1GroundTruthService.resetToCleanBaseline();
        res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getGroundTruthDocuments,
    getGroundTruthDocument,
    getGroundTruthVersions,
    getGroundTruthVersionContent,
    postPromoteGroundTruthVersion,
    postSeedGroundTruthDocuments,
    postResetToCleanBaseline,
};
