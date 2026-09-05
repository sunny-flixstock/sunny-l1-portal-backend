const mongoose = require('mongoose');
const RuleModel = require('../models/Rule.model');
const {
    RULE_TYPES,
    RULE_POLARITIES,
    RULE_PRIORITIES,
    RULE_SOURCES,
} = require('../models/Rule.model');
const ClientModel = require('../models/Client.model');
const InputSetModel = require('../models/InputSet.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');
const { parseEnumListParam } = require('../utils/parseEnumListParam');

const assertValidEnumList = (values, allowed, label) => {
    const invalid = values.filter((value) => !allowed.includes(value));
    if (invalid.length) {
        throw new Api400Error(`Invalid ${label}: ${invalid.join(', ')}`);
    }
};

const applyEnumListFilter = (filter, field, rawValue, allowed, label) => {
    const values = parseEnumListParam(rawValue);
    if (values.length === 0) {
        return;
    }
    assertValidEnumList(values, allowed, label);
    filter[field] = { $in: values };
};

const assertClientExists = async (client) => {
    const exists = await ClientModel.exists({ code: client });
    if (!exists) {
        throw new Api400Error(`Client not found: ${client}`);
    }
};

const normalizeTags = (tags) => {
    if (!Array.isArray(tags)) {
        return [];
    }
    return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
};

const normalizeRuleBody = (body) => ({
    client: body.client.trim(),
    ruleType: body.ruleType,
    polarity: body.polarity,
    ruleText: body.ruleText.trim(),
    priority: body.priority,
    source: body.source,
    createdBy: body.createdBy?.trim() || undefined,
    tags: normalizeTags(body.tags),
});

const listDistinctTags = async (client) => {
    const filter = {};
    if (client) {
        filter.client = client.trim();
    }
    const tags = await RuleModel.distinct('tags', filter);
    return tags.filter(Boolean).sort((a, b) => a.localeCompare(b));
};

const listRules = async ({
    client,
    ruleType,
    polarity,
    priority,
    source,
    tags,
    q,
    pageNum,
    pageSize,
}) => {
    const filter = {};

    if (client) {
        filter.client = client.trim();
    }

    applyEnumListFilter(filter, 'ruleType', ruleType, RULE_TYPES, 'ruleType');
    applyEnumListFilter(filter, 'polarity', polarity, RULE_POLARITIES, 'polarity');
    applyEnumListFilter(filter, 'priority', priority, RULE_PRIORITIES, 'priority');
    applyEnumListFilter(filter, 'source', source, RULE_SOURCES, 'source');

    const tagValues = parseEnumListParam(tags);
    if (tagValues.length > 0) {
        filter.tags = { $in: tagValues };
    }

    if (q) {
        filter.ruleText = { $regex: escapeRegex(q), $options: 'i' };
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [data, total] = await Promise.all([
        RuleModel.find(filter).sort({ client: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
        RuleModel.countDocuments(filter),
    ]);

    return {
        data,
        pagination: {
            total,
            pageNum: resolvedPageNum,
            pageSize: limit,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

const getRuleById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid rule id');
    }

    const rule = await RuleModel.findById(id).lean();
    if (!rule) {
        throw new Api400Error(`Rule not found: ${id}`);
    }
    return rule;
};

const createRule = async (body) => {
    const doc = normalizeRuleBody(body);
    await assertClientExists(doc.client);
    return RuleModel.create(doc);
};

const BULK_CREATE_MAX = 500;

const createRulesBulk = async (rules) => {
    if (!Array.isArray(rules) || rules.length === 0) {
        throw new Api400Error('At least one rule is required');
    }

    if (rules.length > BULK_CREATE_MAX) {
        throw new Api400Error(`Cannot create more than ${BULK_CREATE_MAX} rules at once`);
    }

    const docs = rules.map((body) => normalizeRuleBody(body));
    const clientCodes = [...new Set(docs.map((doc) => doc.client))];

    await Promise.all(clientCodes.map((code) => assertClientExists(code)));

    const data = await RuleModel.insertMany(docs, { ordered: true });
    return data.map((doc) => (doc.toObject ? doc.toObject() : doc));
};

const updateRule = async (id, body) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid rule id');
    }

    const doc = normalizeRuleBody(body);
    await assertClientExists(doc.client);

    const updated = await RuleModel.findByIdAndUpdate(
        id,
        { $set: doc },
        { new: true, runValidators: true }
    ).lean();

    if (!updated) {
        throw new Api400Error(`Rule not found: ${id}`);
    }

    return updated;
};

const deleteRule = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid rule id');
    }

    const inUse = await InputSetModel.countDocuments({ clientRulesIds: id });
    if (inUse > 0) {
        throw new Api400Error(
            `Cannot delete rule: referenced by ${inUse} input set(s)`
        );
    }

    const deleted = await RuleModel.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new Api400Error(`Rule not found: ${id}`);
    }

    return deleted;
};

const getRuleMetadata = () => ({
    domains: RULE_TYPES,
    ruleTypes: RULE_TYPES,
    polarities: RULE_POLARITIES,
    priorities: RULE_PRIORITIES,
    sources: RULE_SOURCES,
});

module.exports = {
    listRules,
    listDistinctTags,
    getRuleById,
    createRule,
    createRulesBulk,
    updateRule,
    deleteRule,
    getRuleMetadata,
};
