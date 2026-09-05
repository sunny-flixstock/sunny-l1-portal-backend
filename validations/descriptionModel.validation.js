const { celebrate, Joi, Segments } = require('celebrate');
const { IMAGE_UPLOAD_TYPES } = require('../services/descriptionModel.service');

const modelIdentityParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        modelIdentity: Joi.string().trim().min(1).required(),
    }),
});

const idParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const createDescriptionModel = celebrate({
    [Segments.BODY]: Joi.object({
        modelIdentity: Joi.string().trim().min(1).required(),
        name: Joi.string().trim().min(1).required(),
        heightInCM: Joi.number().positive().required(),
    }),
});

const listDescriptionModels = celebrate({
    [Segments.QUERY]: Joi.object({
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const updateDescriptionModel = celebrate({
    [Segments.PARAMS]: Joi.object({ modelIdentity: Joi.string().trim().min(1).required() }),
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().min(1),
        heightInCM: Joi.number().positive(),
    }).min(1),
});

const presignModelImageUpload = celebrate({
    [Segments.BODY]: Joi.object({
        modelIdentity: Joi.string().trim().min(1).required(),
        fileName: Joi.string().trim().min(1).required(),
        type: Joi.string().valid(...IMAGE_UPLOAD_TYPES).required(),
    }),
});

const createDescriptionModelImage = celebrate({
    [Segments.BODY]: Joi.object({
        modelIdentity: Joi.string().trim().min(1).required(),
        originalImageKey: Joi.string().trim().min(1).required(),
        cropImageKey: Joi.string().trim().min(1).required(),
        cropLocation: Joi.object({
            x1: Joi.number().required(),
            y1: Joi.number().required(),
            x2: Joi.number().required(),
            y2: Joi.number().required(),
        }).required(),
    }),
});

const listDescriptionModelImages = celebrate({
    [Segments.QUERY]: Joi.object({
        modelIdentity: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const updateDescriptionModelImage = celebrate({
    [Segments.PARAMS]: Joi.object({ id: Joi.string().hex().length(24).required() }),
    [Segments.BODY]: Joi.object({
        originalImageKey: Joi.string().trim().min(1),
        cropImageKey: Joi.string().trim().min(1),
        cropLocation: Joi.object({
            x1: Joi.number().required(),
            y1: Joi.number().required(),
            x2: Joi.number().required(),
            y2: Joi.number().required(),
        }),
    }).min(1),
});

const toggleVisibility = celebrate({
    [Segments.BODY]: Joi.object({
        isActive: Joi.boolean().required(),
    }),
});

const presignSearchImageUpload = celebrate({
    [Segments.BODY]: Joi.object({
        fileName: Joi.string().trim().min(1).required(),
    }),
});

const searchByFaceImage = celebrate({
    [Segments.BODY]: Joi.object({
        imageKey: Joi.string().trim().min(1).required(),
        bucket: Joi.string().trim().min(1),
        modelIdentities: Joi.array().items(Joi.string().trim().min(1)).allow(null),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

module.exports = {
    createDescriptionModel,
    listDescriptionModels,
    getDescriptionModel: modelIdentityParam,
    updateDescriptionModel,
    toggleVisibility,
    presignModelImageUpload,
    createDescriptionModelImage,
    listDescriptionModelImages,
    updateDescriptionModelImage,
    deleteDescriptionModelImage: idParam,
    presignSearchImageUpload,
    searchByFaceImage,
};
