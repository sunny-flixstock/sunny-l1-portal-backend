const { celebrate, Joi, Segments } = require('celebrate');
const { EXAMPLE_IMAGE_TYPES } = require('../models/ExampleImage.model');

const csvEnum = (allowed) =>
    Joi.string()
        .trim()
        .allow('')
        .custom((value, helpers) => {
            if (!value) return value;
            const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
            for (const part of parts) {
                if (!allowed.includes(part)) {
                    return helpers.error('any.invalid');
                }
            }
            return value;
        });

const tagsSchema = Joi.array().items(Joi.string().trim().min(1)).default([]);

const presignFileSchema = Joi.object({
    fileName: Joi.string().trim().min(1).required(),
    contentType: Joi.string().trim().min(1).required(),
});

const listExampleImages = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
        type: csvEnum(EXAMPLE_IMAGE_TYPES),
        tags: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const listTags = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
    }),
});

const exampleImageIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const presignUploads = celebrate({
    [Segments.BODY]: Joi.object({
        client: Joi.string().trim().required(),
        files: Joi.array().min(1).max(50).items(presignFileSchema).required(),
    }),
});

const createExampleImage = celebrate({
    [Segments.BODY]: Joi.object({
        client: Joi.string().trim().required(),
        type: Joi.string()
            .valid(...EXAMPLE_IMAGE_TYPES)
            .required(),
        tags: tagsSchema,
        originalFileName: Joi.string().trim().allow('', null),
        storageFileName: Joi.string().trim().allow('', null),
        imageKey: Joi.string().trim().required(),
        etag: Joi.string().trim().allow('', null),
        uploadedBy: Joi.string().trim().allow('', null),
    }),
});

const updateExampleImage = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.BODY]: Joi.object({
        type: Joi.string().valid(...EXAMPLE_IMAGE_TYPES),
        tags: tagsSchema,
        uploadedBy: Joi.string().trim().allow('', null),
    }).min(1),
});

const batchUpdateExampleImages = celebrate({
    [Segments.BODY]: Joi.object({
        updates: Joi.array()
            .min(1)
            .max(50)
            .items(
                Joi.object({
                    id: Joi.string().hex().length(24).required(),
                    type: Joi.string().valid(...EXAMPLE_IMAGE_TYPES),
                    tags: tagsSchema,
                })
            )
            .required(),
    }),
});

const thumbnailStatus = celebrate({
    [Segments.BODY]: Joi.object({
        ids: Joi.array().min(1).max(50).items(Joi.string().hex().length(24)).required(),
    }),
});

module.exports = {
    listExampleImages,
    listTags,
    getExampleImage: exampleImageIdParam,
    presignUploads,
    createExampleImage,
    updateExampleImage,
    batchUpdateExampleImages,
    thumbnailStatus,
    deleteExampleImage: exampleImageIdParam,
};
