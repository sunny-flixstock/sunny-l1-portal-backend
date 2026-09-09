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
        // Default (false/omitted): hides any SKU-level issue already
        // absorbed into a pending batch-level cluster, so the list is
        // issue-wise by default. 'true' shows the raw unfiltered list.
        includeClustered: Joi.string().valid('true', 'false').optional(),
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

const postAutoRun = celebrate({
    [Segments.BODY]: Joi.object({
        // Default 24h if none of these are given. startTime/endTime (ISO
        // 8601) override windowHours for a custom window.
        windowHours: Joi.number().integer().min(1).max(24 * 30).optional(),
        startTime: Joi.string().isoDate().optional(),
        endTime: Joi.string().isoDate().optional(),
        createdBy: Joi.string().optional(),
    }),
});

module.exports = {
    createBatch,
    getBatch,
    getIssues,
    postIssueDecision,
    postAutoRun,
};
module.exports.getBatchDetail = getBatch;
