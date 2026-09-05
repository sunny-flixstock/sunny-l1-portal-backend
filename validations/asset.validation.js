const { celebrate, Joi, Segments } = require('celebrate');

const getUploadUrl = celebrate({
    [Segments.QUERY]: Joi.object({
        fileName: Joi.string().required(),
        clientName: Joi.string().required(),
    }),
});

const imageSchema = Joi.object({
    name: Joi.string(),
    imagePath: Joi.object({
        key: Joi.string().required(),
        host: Joi.string().required(),
    }).required(),
    characteristics: Joi.object(),
});

const fileSchema = Joi.object({
    barcode: Joi.string().trim().required(),
    images: Joi.array().min(1).items(imageSchema).required(),
});

const createBodySchema = {
    clientName: Joi.string().required(),
    createWithoutCSVData: Joi.boolean().default(false),
};

const create = celebrate({
    [Segments.BODY]: Joi.object({
        ...createBodySchema,
        files: Joi.array().min(1).items(fileSchema).required(),
    }),
});

const createWithProperties = celebrate({
    [Segments.BODY]: Joi.object({
        ...createBodySchema,
        files: Joi.array().min(1).items(fileSchema.keys({ skuProperties: Joi.object() })).required(),
    }),
});

const search = celebrate({
    [Segments.QUERY]: Joi.object({
        clientName: Joi.string().required(),
        barcode: Joi.string().trim(),
        skuId: Joi.string().hex().length(24),
        isActive: Joi.string().valid('true', 'false'),
        fuzzy_text: Joi.string().trim().min(1).max(500),
        includeInternal: Joi.boolean(),
        pageNum: Joi.number().integer().min(1),
        pageSize: Joi.number().integer().min(1).max(100),
        filter: Joi.object().pattern(Joi.string(), Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()))),
    }).unknown(true),
});

const updateAssetUsageCounter = celebrate({
    [Segments.BODY]: Joi.object({
        assetIds: Joi.array().items(Joi.string().hex().length(24)).min(1).required(),
    }),
});

const getInternalAssetUploadUrls = celebrate({
    [Segments.BODY]: Joi.object({
        clientName: Joi.string().required(),
        associatedTo: Joi.string().trim(),
        barcode: Joi.string().trim(),
        files: Joi.array().min(1).items(
            Joi.object({
                ext: Joi.string().trim().lowercase().pattern(/^\.?[a-z0-9]{1,8}$/).required(),
                mimeType: Joi.string().trim(),
            })
        ).required(),
    }),
});

module.exports = { getUploadUrl, create, createWithProperties, search, updateAssetUsageCounter, getInternalAssetUploadUrls };
