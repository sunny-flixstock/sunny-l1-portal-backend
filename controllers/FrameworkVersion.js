const {
    listFrameworkVersions,
    getFrameworkVersionById,
    createFrameworkVersion,
    startFrameworkCreation,
    getFrameworkVersionDomainDescriptions,
    updateFrameworkVersionDomainDescription,
    archiveFrameworkVersion,
    makeFrameworkVersionLive,
    demoteToInReview: demoteVersionToInReview,
} = require('../services/frameworkVersion.service');

const getFrameworkVersions = async (req, res, next) => {
    try {
        const result = await listFrameworkVersions(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getFrameworkVersion = async (req, res, next) => {
    try {
        const version = await getFrameworkVersionById(req.params.id);
        return res.status(200).json({ data: version });
    } catch (err) {
        next(err);
    }
};

const postFrameworkVersion = async (req, res, next) => {
    try {
        const version = await createFrameworkVersion(req.body);
        return res.status(201).json({ data: version });
    } catch (err) {
        next(err);
    }
};

const postStartFrameworkCreation = async (req, res, next) => {
    try {
        const result = await startFrameworkCreation(req.params.id);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getFrameworkVersionDescriptions = async (req, res, next) => {
    try {
        const result = await getFrameworkVersionDomainDescriptions(req.params.id);
        return res.status(200).json({ data: result });
    } catch (err) {
        next(err);
    }
};

const patchFrameworkVersionDomainDescription = async (req, res, next) => {
    try {
        const result = await updateFrameworkVersionDomainDescription(
            req.params.id,
            req.params.domain,
            req.body.contentMarkdown
        );
        return res.status(200).json({ data: result });
    } catch (err) {
        next(err);
    }
};

const postArchiveFrameworkVersion = async (req, res, next) => {
    try {
        const version = await archiveFrameworkVersion(req.params.id);
        return res.status(200).json({ data: version });
    } catch (err) {
        next(err);
    }
};

const postMakeFrameworkVersionLive = async (req, res, next) => {
    try {
        const result = await makeFrameworkVersionLive(req.params.id);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const demoteToInReview = async (req, res, next) => {
    try {
        const result = await demoteVersionToInReview(req.params.id);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getFrameworkVersions,
    getFrameworkVersion,
    postFrameworkVersion,
    postStartFrameworkCreation,
    getFrameworkVersionDescriptions,
    patchFrameworkVersionDomainDescription,
    postArchiveFrameworkVersion,
    postMakeFrameworkVersionLive,
    demoteToInReview,
};
