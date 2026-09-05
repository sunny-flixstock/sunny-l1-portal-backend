const { celebrate, Joi, Segments } = require('celebrate');

const columnConfigSchema = Joi.object({
    required: Joi.boolean(),
    allowedValues: Joi.array().items(Joi.string().trim().min(1)),
    sources: Joi.array().items(Joi.string().trim().min(1)),
}).unknown(true);

const csvConfigSchema = Joi.object({
    columns: Joi.object().pattern(Joi.string().trim().min(1), columnConfigSchema).required(),
}).required();

const listAllClients = celebrate({
    [Segments.QUERY]: Joi.object({
        q: Joi.string().trim().allow(''),
    }),
});

const getClients = celebrate({
    [Segments.QUERY]: Joi.object({
        q: Joi.string().trim().allow(''),
        pageNum: Joi.number().integer().min(1).default(1),
        pageSize: Joi.number().integer().min(1).max(100).default(20),
    }),
});

const getClient = celebrate({
    [Segments.PARAMS]: Joi.object({
        code: Joi.string().trim().required(),
    }),
});

const createClient = celebrate({
    [Segments.BODY]: Joi.object({
        code: Joi.string().trim().min(1).max(64).required(),
        displayName: Joi.string().trim().max(256).allow('').optional(),
        enableFXGTOM: Joi.boolean().default(false),
    }),
});

const bulkCreateClients = celebrate({
    [Segments.BODY]: Joi.object({
        clients: Joi.array()
            .items(
                Joi.object({
                    code: Joi.string().trim().min(1).max(64).required(),
                    displayName: Joi.string().trim().min(1).max(256).required(),
                    enableFXGTOM: Joi.boolean().required(),
                })
            )
            .min(1)
            .max(500)
            .required(),
    }),
});

const patchEnableFXGTOM = celebrate({
    [Segments.PARAMS]: Joi.object({
        code: Joi.string().trim().required(),
    }),
    [Segments.BODY]: Joi.object({
        enableFXGTOM: Joi.boolean().required(),
    }),
});

const patchCsvConfig = celebrate({
    [Segments.PARAMS]: Joi.object({
        code: Joi.string().trim().required(),
    }),
    [Segments.BODY]: Joi.object({
        csvConfig: csvConfigSchema,
    }),
});

module.exports = {
    listAllClients,
    getClients,
    getClient,
    createClient,
    bulkCreateClients,
    patchEnableFXGTOM,
    patchCsvConfig,
};
