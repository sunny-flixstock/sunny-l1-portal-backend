const { celebrate, Joi, Segments } = require('celebrate');
const {
    COLOR_MODES,
    FILE_FORMATS,
} = require('../models/AngleTechnicalSpecification.model');

const dimensionsSchema = Joi.object({
    width: Joi.number().integer().min(1).required(),
    height: Joi.number().integer().min(1).required(),
    dpi: Joi.number().integer().min(1).required(),
});

const backgroundSchema = Joi.object({
    color: Joi.string().trim().default('#FFFFFF'),
});

const fileSpecificationsSchema = Joi.object({
    colorMode: Joi.string()
        .valid(...COLOR_MODES)
        .required(),
    fileFormat: Joi.string()
        .valid(...FILE_FORMATS)
        .required(),
});

const angleTechnicalSpecificationIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const listAngleTechnicalSpecifications = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const createAngleTechnicalSpecification = celebrate({
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().required(),
        client: Joi.string().trim().required(),
        dimensions: dimensionsSchema.required(),
        background: backgroundSchema.default({ color: '#FFFFFF' }),
        fileSpecifications: fileSpecificationsSchema.required(),
    }),
});

const getAngleTechnicalSpecification = angleTechnicalSpecificationIdParam;
const deleteAngleTechnicalSpecification = angleTechnicalSpecificationIdParam;

module.exports = {
    listAngleTechnicalSpecifications,
    getAngleTechnicalSpecification,
    createAngleTechnicalSpecification,
    deleteAngleTechnicalSpecification,
};
