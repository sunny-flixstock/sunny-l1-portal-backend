const { celebrate, Joi, Segments } = require('celebrate');
const { ANGLE_STATUSES } = require('../models/BaseAngle.model');

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

const listBaseAngles = celebrate({
    [Segments.QUERY]: Joi.object({
        q: Joi.string().trim().allow(''),
        status: Joi.string().valid(...ANGLE_STATUSES, 'all').default('active'),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const getBaseAngle = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.QUERY]: Joi.object({
        includeContent: Joi.string().valid('true', 'false'),
    }),
});

const getBaseAngleVersions = celebrate({
    [Segments.PARAMS]: Joi.object({
        seriesKey: Joi.string().trim().min(1).required(),
    }),
});

const presignUploads = celebrate({
    [Segments.BODY]: Joi.object({
        files: Joi.array().min(1).max(50).items(presignFileSchema).required(),
    }),
});

const createBaseAngle = celebrate({
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().min(1),
        seriesKey: Joi.string().trim().allow('', null),
        definitionMarkdown: Joi.string().trim().min(1).required(),
        sampleImages: Joi.array().items(imagePathSchema).default([]),
    }).or('name', 'seriesKey'),
});

const patchBaseAngleName = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().min(1).required(),
    }),
});

const archiveBaseAngle = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

module.exports = {
    listBaseAngles,
    getBaseAngle,
    getBaseAngleVersions,
    presignUploads,
    createBaseAngle,
    patchBaseAngleName,
    archiveBaseAngle,
};
