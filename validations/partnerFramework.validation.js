const { celebrate, Joi, Segments } = require('celebrate');

const getPartnerFramework = celebrate({
    [Segments.QUERY]: Joi.object({
        client: Joi.string().trim().required(),
        gender: Joi.string().trim().optional(),
        season: Joi.string().trim().optional(),
        category: Joi.string().trim().optional(),
    }),
});

module.exports = {
    getPartnerFramework,
};
