const { celebrate, Joi, Segments } = require('celebrate');

const search = celebrate({
    [Segments.QUERY]: Joi.object({
        clientName: Joi.string().required(),
        assetType: Joi.string().valid('client', 'internal').default('client'),
        barcode: Joi.string().trim(),
        isActive: Joi.string().valid('true', 'false'),
        createdWithoutCSVDataPreCheck: Joi.string().valid('true', 'false'),
        embeddingDone: Joi.string().valid('true', 'false'),
        createdAfter: Joi.string().trim(),
        createdBefore: Joi.string().trim(),
        pageNum: Joi.number().integer().min(1),
        pageSize: Joi.number().integer().min(1).max(100),
        filter: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()))),
        includeInternal: Joi.boolean(),
    }).unknown(true),
});

const statsByClient = celebrate({
    [Segments.QUERY]: Joi.object({}),
});

const getById = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().hex().length(24).required(),
    }),
});

const getByClientAndBarcode = celebrate({
    [Segments.QUERY]: Joi.object({
        clientName: Joi.string().trim().required(),
        barcode: Joi.string().trim().required(),
    }),
});

const importCsv = celebrate({
    [Segments.QUERY]: Joi.object({
        clientName: Joi.string().required(),
    }),
});

const doNotProduce = celebrate({
    [Segments.BODY]: Joi.object({
        barcode: Joi.string().trim().required(),
        clientName: Joi.string().trim().required(),
        shouldNotProduce: Joi.boolean().required(),
    }),
});

const aggregate = celebrate({
    [Segments.BODY]: Joi.object({
        pipeline: Joi.array().items(Joi.object().min(1)).min(1).required(),
    }),
});

const saveCsvData = celebrate({
    [Segments.BODY]: Joi.object({
        barcode: Joi.string().trim().required(),
        clientName: Joi.string().trim().required(),
        csvData: Joi.object().pattern(/^[^$]/, Joi.any()).min(1).required(),
    }),
});

module.exports = { search, statsByClient, getById, getByClientAndBarcode, importCsv, doNotProduce, saveCsvData, aggregate };
