const { celebrate, Joi, Segments } = require('celebrate');

const getPayloadSession = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
});

const postVerifyFeedbackItem = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
    [Segments.BODY]: Joi.object({
        skuId: Joi.string().required(),
        itemIndex: Joi.number().integer().min(0).required(),
        status: Joi.string().valid('correct', 'wrong').required(),
        verifiedBy: Joi.string().trim().optional(),
    }),
});

module.exports = {
    getPayloadSession,
    postVerifyFeedbackItem,
};
