const { celebrate, Joi, Segments } = require('celebrate');

const getFilters = celebrate({
    [Segments.QUERY]: Joi.object({
        clientName: Joi.string().required(),
    }),
});

const searchValues = celebrate({
    [Segments.QUERY]: Joi.object({
        clientName: Joi.string().required(),
        key:        Joi.string().required(),
        q:          Joi.string().min(1).required(),
        pageNum:    Joi.number().integer().min(1).default(1),
        pageSize:   Joi.number().integer().min(1).max(200).default(20),
    }),
});

module.exports = { getFilters, searchValues };
