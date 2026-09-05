const { celebrate, Joi, Segments } = require('celebrate');

const DOC_NAME_PATTERN = /^[\w.-]+\.(html|md)$/i;

const getApiDocByName = celebrate({
    [Segments.PARAMS]: Joi.object({
        name: Joi.string().trim().required().pattern(DOC_NAME_PATTERN),
    }),
});

module.exports = {
    getApiDocByName,
};
