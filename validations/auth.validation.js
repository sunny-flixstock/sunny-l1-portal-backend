const { celebrate, Joi, Segments } = require('celebrate');

const postGoogleLogin = celebrate({
    [Segments.BODY]: Joi.object({
        credential: Joi.string().required(),
    }),
});

module.exports = { postGoogleLogin };
