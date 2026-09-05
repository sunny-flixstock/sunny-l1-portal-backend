const {
    listRules,
    listDistinctTags,
    getRuleById,
    createRule,
    createRulesBulk,
    updateRule,
    deleteRule,
    getRuleMetadata,
} = require('../services/rule.service');

const getRules = async (req, res, next) => {
    try {
        const result = await listRules(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getRule = async (req, res, next) => {
    try {
        const rule = await getRuleById(req.params.id);
        return res.status(200).json({ data: rule });
    } catch (err) {
        next(err);
    }
};

const getRuleTags = async (req, res, next) => {
    try {
        const tags = await listDistinctTags(req.query.client);
        return res.status(200).json({ data: tags });
    } catch (err) {
        next(err);
    }
};

const getRulesMeta = async (req, res, next) => {
    try {
        return res.status(200).json({ data: getRuleMetadata() });
    } catch (err) {
        next(err);
    }
};

const postRule = async (req, res, next) => {
    try {
        const rule = await createRule(req.body);
        const data = rule.toObject ? rule.toObject() : rule;
        return res.status(201).json({ data });
    } catch (err) {
        next(err);
    }
};

const postRulesBulk = async (req, res, next) => {
    try {
        const data = await createRulesBulk(req.body.rules);
        return res.status(201).json({ data, count: data.length });
    } catch (err) {
        next(err);
    }
};

const putRule = async (req, res, next) => {
    try {
        const rule = await updateRule(req.params.id, req.body);
        return res.status(200).json({ data: rule });
    } catch (err) {
        next(err);
    }
};

const removeRule = async (req, res, next) => {
    try {
        const rule = await deleteRule(req.params.id);
        return res.status(200).json({ data: rule });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getRules,
    getRule,
    getRuleTags,
    getRulesMeta,
    postRule,
    postRulesBulk,
    putRule,
    removeRule,
};
