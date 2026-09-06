const { celebrate, Joi, Segments } = require('celebrate');

const createBatch = celebrate({
    [Segments.BODY]: Joi.object({
        configs: Joi.array()
            .items(
                Joi.object({
                    skuId: Joi.string().required(),
                    config: Joi.object().required(),
                    // Optional: feedback given separately from the config
                    // (not already embedded in a variant's feedback.text) --
                    // the caller names exactly which angle/variant each
                    // comment is about; no inference/correlation is done.
                    feedbackEntries: Joi.array()
                        .items(
                            Joi.object({
                                clientAngleId: Joi.string().required(),
                                variantIndex: Joi.number().integer().required(),
                                feedbackText: Joi.string().required(),
                            })
                        )
                        .optional(),
                })
            )
            .min(1)
            .required(),
        createdBy: Joi.string().optional(),
    }),
});

const getBatch = celebrate({
    [Segments.PARAMS]: Joi.object({
        id: Joi.string().required(),
    }),
});

const getIssues = celebrate({
    [Segments.QUERY]: Joi.object({
        skuIds: Joi.string().optional(),
    }),
});

const postIssueDecision = celebrate({
    [Segments.BODY]: Joi.object({
        skuId: Joi.string().required(),
        clientAngleId: Joi.string().required(),
        variantIndex: Joi.number().integer().required(),
        decision: Joi.string().valid('candidate_0', 'candidate_1', 'reject', 'custom').required(),
        customInstruction: Joi.string().optional(),
        comment: Joi.string().allow('').optional(),
    }),
});

module.exports = {
    createBatch,
    getBatch,
    getIssues,
    postIssueDecision,
};
module.exports.getBatchDetail = getBatch;
