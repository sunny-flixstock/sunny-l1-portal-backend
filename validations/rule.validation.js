const { celebrate, Joi, Segments } = require('celebrate');
const {
    RULE_TYPES,
    RULE_POLARITIES,
    RULE_PRIORITIES,
    RULE_SOURCES,
} = require('../models/Rule.model');

const csvEnum = (allowed) =>
    Joi.string()
        .trim()
        .allow('')
        .custom((value, helpers) => {
            if (!value) {
                return value;
            }

            const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
            for (const part of parts) {
                if (!allowed.includes(part)) {
                    return helpers.error('any.invalid');
                }
            }
            return value;
        });

const tagsSchema = Joi.array().items(Joi.string().trim().min(1)).default([]);

const ruleBodySchema = Joi.object({
    client: Joi.string().trim().required(),
    ruleType: Joi.string()
        .valid(...RULE_TYPES)
        .required(),
    polarity: Joi.string()
        .valid(...RULE_POLARITIES)
        .required(),
    ruleText: Joi.string().trim().min(1).required(),
    priority: Joi.string()
        .valid(...RULE_PRIORITIES)
        .required(),
    source: Joi.string()
        .valid(...RULE_SOURCES)
        .required(),
    createdBy: Joi.string().trim().allow('', null).empty('').default(null),
    tags: tagsSchema,
});

const listRules = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
        ruleType: csvEnum(RULE_TYPES),
        polarity: csvEnum(RULE_POLARITIES),
        priority: csvEnum(RULE_PRIORITIES),
        source: csvEnum(RULE_SOURCES),
        tags: Joi.string().trim().allow(''),
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const ruleIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const createRule = celebrate({
    [Segments.BODY]: ruleBodySchema,
});

const bulkCreateRules = celebrate({
    [Segments.BODY]: Joi.object({
        rules: Joi.array().items(ruleBodySchema).min(1).max(500).required(),
    }),
});

const updateRule = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.BODY]: ruleBodySchema,
});

const listTags = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
    }),
});

const getRule = ruleIdParam;
const deleteRule = ruleIdParam;

module.exports = {
    listRules,
    listTags,
    getRule,
    createRule,
    bulkCreateRules,
    updateRule,
    deleteRule,
};
