const { celebrate, Joi, Segments } = require('celebrate');

const objectId = Joi.string().hex().length(24);

const imageSpecEntrySchema = Joi.object({
    angleTechnicalSpecificationId: objectId.required(),
    namingPattern: Joi.string().trim().min(1).required(),
});

const presetEntrySchema = Joi.object({
    clientAngleId: objectId.required(),
    imageSpecs: Joi.array().items(imageSpecEntrySchema).min(1).required(),
});

const anglePresetIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: objectId.required(),
    }),
});

const listAnglePresets = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const createAnglePreset = celebrate({
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().required(),
        client: Joi.string().trim().required(),
        entries: Joi.array().items(presetEntrySchema).min(1).required(),
    }),
});

const updateAnglePreset = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: objectId.required(),
    }),
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim(),
        entries: Joi.array().items(presetEntrySchema).min(1),
    }).min(1),
});

const getAnglePreset = anglePresetIdParam;
const deleteAnglePreset = anglePresetIdParam;

module.exports = {
    listAnglePresets,
    getAnglePreset,
    createAnglePreset,
    updateAnglePreset,
    deleteAnglePreset,
};
