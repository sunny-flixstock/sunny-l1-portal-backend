const { celebrate, Joi, Segments } = require('celebrate');

const digitalizedFundus = celebrate({
    [Segments.QUERY]: Joi.object({
        clientName: Joi.string().required(),
        includeInternal: Joi.boolean().default(false),
        patternDictFilter: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()))),
    }),
});

module.exports = { digitalizedFundus };
