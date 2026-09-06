const { celebrate, Joi, Segments } = require('celebrate');

const postLogin = celebrate({
    [Segments.BODY]: Joi.object({
        password: Joi.string().required(),
    }),
});

module.exports = { postLogin };
