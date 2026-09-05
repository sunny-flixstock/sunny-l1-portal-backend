const { celebrate, Joi, Segments } = require('celebrate');
const { DESCRIPTION_PROVIDER_VALUES } = require('../utils/modelSelection');
const { DOMAINS } = require('../utils/domains');

const objectId = Joi.string().hex().length(24);

const domainInstruction = Joi.object({
    domain: Joi.string().trim().min(1).required(),
    instructionId: objectId.required(),
    provider: Joi.string()
        .trim()
        .valid(...DESCRIPTION_PROVIDER_VALUES)
        .required(),
    model: Joi.string().trim().min(1).required(),
});

const listFrameworkVersions = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
        frameworkGroupId: objectId.allow(''),
        status: Joi.string().trim().allow(''),
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const frameworkVersionIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: objectId.required(),
    }),
});

const createFrameworkVersion = celebrate({
    [Segments.BODY]: Joi.object({
        frameworkGroupId: objectId.required(),
        client: Joi.string().trim().required(),
        name: Joi.string().trim().min(1).required(),
        domains: Joi.array().items(Joi.string().trim().min(1)).min(1).required(),
        descriptionGenerationInstructions: Joi.array().items(domainInstruction).min(1).required(),
        frameworkCreationInstructions: Joi.array().items(domainInstruction).min(1).required(),
        inputSet: objectId.required(),
        frameworkVocabId: objectId.required(),
        categoryRegistryId: objectId.required(),
    }),
});

const getFrameworkVersion = frameworkVersionIdParam;

const startFrameworkCreation = frameworkVersionIdParam;

const getFrameworkVersionDomainDescriptions = frameworkVersionIdParam;

const updateFrameworkVersionDomainDescription = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: objectId.required(),
        domain: Joi.string()
            .trim()
            .valid(...DOMAINS)
            .required(),
    }),
    [Segments.BODY]: Joi.object({
        contentMarkdown: Joi.string().trim().min(1).required(),
    }),
});

const archiveFrameworkVersion = frameworkVersionIdParam;

const makeFrameworkVersionLive = frameworkVersionIdParam;

const demoteToInReview = frameworkVersionIdParam;

module.exports = {
    listFrameworkVersions,
    getFrameworkVersion,
    createFrameworkVersion,
    startFrameworkCreation,
    getFrameworkVersionDomainDescriptions,
    updateFrameworkVersionDomainDescription,
    archiveFrameworkVersion,
    makeFrameworkVersionLive,
    demoteToInReview,
};
