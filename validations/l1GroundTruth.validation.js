const { celebrate, Joi, Segments } = require('celebrate');

const listGroundTruthDocuments = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().optional(),
    }),
});

const getGroundTruthDocument = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
});

const getGroundTruthVersions = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
});

const getGroundTruthVersionContent = celebrate({
    [Segments.PARAMS]: Joi.object({
        versionId: Joi.string().required(),
    }),
});

const promoteGroundTruthVersion = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
    [Segments.BODY]: Joi.object({
        versionId: Joi.string().required(),
    }),
});

const resetToCleanBaseline = celebrate({
    [Segments.BODY]: Joi.object({
        confirm: Joi.boolean().valid(true).required(),
    }),
});

module.exports = {
    listGroundTruthDocuments,
    getGroundTruthDocument,
    getGroundTruthVersions,
    getGroundTruthVersionContent,
    promoteGroundTruthVersion,
    resetToCleanBaseline,
};
