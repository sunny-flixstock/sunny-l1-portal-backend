const { celebrate, Joi, Segments } = require('celebrate');

const optionalConstraint = Joi.string().trim().allow('', null).empty('').default(null);

const groupBodySchema = Joi.object({
    client: Joi.string().trim().required(),
    gender: optionalConstraint,
    season: optionalConstraint,
    category: optionalConstraint,
    priority: Joi.number().integer().default(0),
    name: Joi.string().trim().allow('', null).empty('').default(null),
});

const listFrameworkGroups = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
        gender: Joi.string().trim().allow(''),
        season: Joi.string().trim().allow(''),
        category: Joi.string().trim().allow(''),
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const frameworkGroupIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const createFrameworkGroup = celebrate({
    [Segments.BODY]: groupBodySchema,
});

const updateFrameworkGroup = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.BODY]: groupBodySchema,
});

const getFrameworkGroup = frameworkGroupIdParam;
const deleteFrameworkGroup = frameworkGroupIdParam;

module.exports = {
    listFrameworkGroups,
    getFrameworkGroup,
    createFrameworkGroup,
    updateFrameworkGroup,
    deleteFrameworkGroup,
};
