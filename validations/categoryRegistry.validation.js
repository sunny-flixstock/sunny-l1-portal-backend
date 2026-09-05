const { celebrate, Joi, Segments } = require('celebrate');

const registryBodySchema = Joi.alternatives()
    .try(Joi.object().unknown(true), Joi.array().items(Joi.any()))
    .required()
    .messages({
        'alternatives.match': 'registry must be a JSON object or array',
    });

const listCategoryRegistries = celebrate({
    [Segments.QUERY]: Joi.object({
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const categoryRegistryIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const createCategoryRegistry = celebrate({
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().required(),
        registry: registryBodySchema,
    }),
});

const getCategoryRegistry = categoryRegistryIdParam;
const deleteCategoryRegistry = categoryRegistryIdParam;

module.exports = {
    listCategoryRegistries,
    getCategoryRegistry,
    createCategoryRegistry,
    deleteCategoryRegistry,
};
