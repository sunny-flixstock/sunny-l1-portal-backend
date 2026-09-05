const { celebrate, Joi, Segments } = require('celebrate');

const vocabBodySchema = Joi.alternatives()
    .try(Joi.object().unknown(true), Joi.array().items(Joi.any()))
    .required()
    .messages({
        'alternatives.match': 'vocab must be a JSON object or array',
    });

const listFrameworkVocabs = celebrate({
    [Segments.QUERY]: Joi.object({
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const frameworkVocabIdParam = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const createFrameworkVocab = celebrate({
    [Segments.BODY]: Joi.object({
        name: Joi.string().trim().required(),
        vocab: vocabBodySchema,
    }),
});

const getFrameworkVocab = frameworkVocabIdParam;
const deleteFrameworkVocab = frameworkVocabIdParam;

module.exports = {
    listFrameworkVocabs,
    getFrameworkVocab,
    createFrameworkVocab,
    deleteFrameworkVocab,
};
