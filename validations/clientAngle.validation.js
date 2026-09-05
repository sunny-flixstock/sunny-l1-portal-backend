const { celebrate, Joi, Segments } = require('celebrate');
const { ANGLE_STATUSES } = require('../models/ClientAngle.model');
const { DESCRIPTION_PROVIDER_OPTIONS } = require('../model.catalog');

const ALLOWED_PROVIDERS = DESCRIPTION_PROVIDER_OPTIONS.map((option) => option.value);

const presignFileSchema = Joi.object({
    fileName: Joi.string().trim().min(1).required(),
    contentType: Joi.string().trim().min(1).required(),
});

const imagePathSchema = Joi.object({
    imagePath: Joi.object({
        key: Joi.string().trim().required(),
        host: Joi.string().trim().allow('', null),
        channel: Joi.string().trim().allow('', null),
    }).required(),
    name: Joi.string().trim().allow('', null),
    description: Joi.string().trim().allow('', null),
});

const listClientAngles = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
        baseAngleSeriesKey: Joi.string().trim().allow(''),
        q: Joi.string().trim().allow(''),
        status: Joi.string().valid(...ANGLE_STATUSES, 'all').default('active'),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const listAllClientAngles = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().min(1).required(),
        baseAngleSeriesKey: Joi.string().trim().allow(''),
        q: Joi.string().trim().allow(''),
        status: Joi.string().valid(...ANGLE_STATUSES, 'all').default('active'),
    }),
});

const getClientAngle = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.QUERY]: Joi.object({
        includeContent: Joi.string().valid('true', 'false'),
    }),
});

const getClientAngleVersions = celebrate({
    [Segments.PARAMS]: Joi.object({
        seriesKey: Joi.string().trim().min(1).required(),
    }),
});

const presignUploads = celebrate({
    [Segments.BODY]: Joi.object({
        client: Joi.string().trim().required(),
        files: Joi.array().min(1).max(50).items(presignFileSchema).required(),
    }),
});

const generateClientAngle = celebrate({
    [Segments.BODY]: Joi.object({
        client: Joi.string().trim().required(),
        baseAngleId: Joi.string().hex().length(24).required(),
        systemInstructionId: Joi.string().hex().length(24).required(),
        referenceImages: Joi.array().min(1).items(imagePathSchema).required(),
        provider: Joi.string()
            .valid(...ALLOWED_PROVIDERS)
            .required(),
        model: Joi.string().trim().min(1).required(),
        name: Joi.string().trim().allow('', null),
        seriesKey: Joi.string().trim().allow('', null),
    }),
});

const reviseClientAngleDefinition = celebrate({
    [Segments.BODY]: Joi.object({
        seriesKey: Joi.string().trim().min(1).required(),
        definitionMarkdown: Joi.string().trim().min(1).required(),
        name: Joi.string().trim().allow('', null),
    }),
});

const patchClientAngleName = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().min(1).required(),
    }),
});

const archiveClientAngle = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

module.exports = {
    listClientAngles,
    listAllClientAngles,
    getClientAngle,
    getClientAngleVersions,
    presignUploads,
    generateClientAngle,
    reviseClientAngleDefinition,
    patchClientAngleName,
    archiveClientAngle,
};
