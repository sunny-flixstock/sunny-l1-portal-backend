const { celebrate, Joi, Segments } = require('celebrate');
const {
    INSTRUCTION_TYPES,
    INSTRUCTION_STATUSES,
} = require('../models/SystemInstruction.model');

const outputSchemaField = Joi.alternatives()
    .try(Joi.object(), Joi.string().trim().allow(''))
    .optional()
    .default({});

const createSystemInstruction = celebrate({
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().min(1).required(),
        instructionType: Joi.string()
            .valid(...INSTRUCTION_TYPES)
            .required(),
        purpose: Joi.string().trim().min(1).required(),
        systemPrompt: Joi.string().trim().min(1).required(),
        outputSchema: outputSchemaField,
        seriesKey: Joi.string().trim().allow('', null).empty('').default(null),
    }),
});

const listSystemInstructions = celebrate({
    [Segments.QUERY]: Joi.object({
        instructionType: Joi.string()
            .valid(...INSTRUCTION_TYPES)
            .allow(''),
        status: Joi.string()
            .valid(...INSTRUCTION_STATUSES)
            .allow(''),
        seriesKey: Joi.string().trim().allow(''),
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const instructionIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const getSystemInstruction = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.QUERY]: Joi.object({
        includeContent: Joi.string().valid('true', 'false').default('false'),
    }),
});

const patchSystemInstructionName = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().min(1).required(),
    }),
});

module.exports = {
    createSystemInstruction,
    listSystemInstructions,
    getSystemInstruction,
    patchSystemInstructionName,
    deleteSystemInstruction: instructionIdParam,
};
