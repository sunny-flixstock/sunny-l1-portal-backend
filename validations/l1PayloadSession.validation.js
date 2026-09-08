const { celebrate, Joi, Segments } = require('celebrate');

const getPayloadSession = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
});

module.exports = {
    getPayloadSession,
};
