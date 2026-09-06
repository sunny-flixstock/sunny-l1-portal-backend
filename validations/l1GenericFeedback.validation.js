const { celebrate, Joi, Segments } = require('celebrate');

const postGenericFeedback = celebrate({
    [Segments.BODY]: Joi.object({
        text: Joi.string().trim().min(1).required(),
        images: Joi.array()
            .items(
                Joi.object({
                    data: Joi.string().base64().required(),
                    mimeType: Joi.string().required(),
                    label: Joi.string().valid('bad', 'good').optional(),
                })
            )
            .default([]),
        createdBy: Joi.string().optional(),
    }),
});

const getGenericFeedbackById = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
});

const postGenericFeedbackDecision = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
    [Segments.BODY]: Joi.object({
        targetIndex: Joi.number().integer().min(0).required(),
        decision: Joi.string().valid('candidate_0', 'candidate_1', 'reject', 'custom').required(),
        customInstruction: Joi.string().optional(),
        comment: Joi.string().allow('').optional(),
        decidedBy: Joi.string().optional(),
    }),
});

module.exports = {
    postGenericFeedback,
    getGenericFeedbackById,
    postGenericFeedbackDecision,
};
