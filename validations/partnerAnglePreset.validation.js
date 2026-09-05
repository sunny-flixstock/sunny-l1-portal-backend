const { celebrate, Joi, Segments } = require('celebrate');

const listPartnerAnglePresets = celebrate({
    [Segments.QUERY]: Joi.object({
        clientName: Joi.string().trim().required(),
    }),
});

module.exports = {
    listPartnerAnglePresets,
};
