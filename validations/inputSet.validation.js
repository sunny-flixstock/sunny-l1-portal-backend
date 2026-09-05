const { celebrate, Joi, Segments } = require('celebrate');
const { INPUT_SET_STATUSES } = require('../models/InputSet.model');

const objectIdList = Joi.array().items(Joi.string().hex().length(24)).default([]);

const inputSetBodySchema = Joi.object({
    name: Joi.string().trim().min(1).required(),
    client: Joi.string().trim().required(),
    createdBy: Joi.string().trim().allow('', null).empty('').default(null),
    clientRulesIds: objectIdList,
    exampleImageIds: objectIdList,
    notes: Joi.string().trim().allow('', null).empty('').default(null),
});

const listInputSets = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().allow(''),
        status: Joi.string()
            .valid(...INPUT_SET_STATUSES)
            .allow(''),
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const inputSetIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const createInputSet = celebrate({
    [Segments.BODY]: inputSetBodySchema,
});

const updateInputSet = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.BODY]: inputSetBodySchema,
});

const getInputSet = inputSetIdParam;

const deleteInputSet = inputSetIdParam;

module.exports = {
    listInputSets,
    getInputSet,
    createInputSet,
    updateInputSet,
    deleteInputSet,
};
