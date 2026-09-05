const mongoose = require('mongoose');
const InputSetModel = require('../models/InputSet.model');
const { INPUT_SET_STATUSES } = require('../models/InputSet.model');
const RuleModel = require('../models/Rule.model');
const ExampleImageModel = require('../models/ExampleImage.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');
const { completeImageObject } = require('../utils/completeImageObject');
const { GetMD5Hash } = require('../utils/crypto');

const toObjectIds = (ids, label) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        return [];
    }

    const unique = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
    for (const id of unique) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Api400Error(`Invalid ${label} id: ${id}`);
        }
    }
    return unique.map((id) => new mongoose.Types.ObjectId(id));
};

const assertClientExists = async (client) => {
    const exists = await ClientModel.exists({ code: client });
    if (!exists) {
        throw new Api400Error(`Client not found: ${client}`);
    }
};

const assertUniqueName = async (name, excludeId) => {
    const filter = { name: name.trim() };
    if (excludeId) {
        filter._id = { $ne: excludeId };
    }
    const existing = await InputSetModel.findOne(filter).select({ _id: 1 }).lean();
    if (existing) {
        throw new Api400Error(`Input set name already exists: ${name.trim()}`);
    }
};

const enrichExampleImage = (doc) => {
    if (!doc) return doc;
    const plain = { ...doc };
    if (plain.image) {
        completeImageObject(plain.image);
    }
    return plain;
};

const partitionExampleIds = async (client, exampleImageIds) => {
    const ids = toObjectIds(exampleImageIds, 'exampleImage');
    if (ids.length === 0) {
        return { goodExampleImageIds: [], badExampleImageIds: [] };
    }

    const images = await ExampleImageModel.find({ _id: { $in: ids } })
        .select({ _id: 1, client: 1, type: 1 })
        .lean();

    if (images.length !== ids.length) {
        throw new Api400Error('One or more example images were not found');
    }

    const wrongClient = images.filter((img) => img.client !== client);
    if (wrongClient.length) {
        throw new Api400Error('Example images must belong to the selected client');
    }

    const goodExampleImageIds = [];
    const badExampleImageIds = [];

    for (const image of images) {
        if (image.type === 'good') {
            goodExampleImageIds.push(image._id);
        } else {
            badExampleImageIds.push(image._id);
        }
    }

    return { goodExampleImageIds, badExampleImageIds };
};

const sortRulesForHash = (rules) =>
    [...rules].sort((a, b) => {
        const polarityCmp = a.polarity.localeCompare(b.polarity);
        if (polarityCmp !== 0) return polarityCmp;
        const priorityCmp = a.priority.localeCompare(b.priority);
        if (priorityCmp !== 0) return priorityCmp;
        return a.ruleText.localeCompare(b.ruleText);
    });

const buildRuleHashByType = async (rules) => {
    const byType = new Map();
    for (const rule of rules) {
        if (!byType.has(rule.ruleType)) {
            byType.set(rule.ruleType, []);
        }
        byType.get(rule.ruleType).push(rule);
    }

    const ruleHash = {};
    for (const [ruleType, typeRules] of byType) {
        const combined = sortRulesForHash(typeRules)
            .map((rule) => `${rule.polarity}-${rule.priority}-${rule.ruleText}`)
            .join('');
        ruleHash[ruleType] = await GetMD5Hash(combined);
    }
    return ruleHash;
};

const assertRulesForClient = async (client, clientRulesIds) => {
    const ids = toObjectIds(clientRulesIds, 'rule');
    if (ids.length === 0) {
        return { ids, ruleHash: {} };
    }

    const rules = await RuleModel.find({ _id: { $in: ids } })
        .select({ _id: 1, client: 1, ruleType: 1, polarity: 1, priority: 1, ruleText: 1 })
        .lean();

    if (rules.length !== ids.length) {
        throw new Api400Error('One or more rules were not found');
    }

    const wrongClient = rules.filter((rule) => rule.client !== client);
    if (wrongClient.length) {
        throw new Api400Error('Rules must belong to the selected client');
    }

    const ruleHash = await buildRuleHashByType(rules);
    return { ids, ruleHash };
};

const buildInputSetDetail = async (doc) => {
    const ruleIds = doc.clientRulesIds ?? [];
    const exampleIds = [
        ...(doc.goodExampleImageIds ?? []),
        ...(doc.badExampleImageIds ?? []),
    ];

    const [rules, examples] = await Promise.all([
        ruleIds.length
            ? RuleModel.find({ _id: { $in: ruleIds } }).sort({ ruleText: 1 }).lean()
            : [],
        exampleIds.length
            ? ExampleImageModel.find({ _id: { $in: exampleIds } }).lean()
            : [],
    ]);

    const exampleById = new Map(examples.map((row) => [String(row._id), enrichExampleImage(row)]));

    const goodExamples = (doc.goodExampleImageIds ?? [])
        .map((id) => exampleById.get(String(id)))
        .filter(Boolean);
    const badExamples = (doc.badExampleImageIds ?? [])
        .map((id) => exampleById.get(String(id)))
        .filter(Boolean);

    const ruleHash =
        doc.ruleHash instanceof Map ? Object.fromEntries(doc.ruleHash) : doc.ruleHash ?? {};

    return {
        ...doc,
        ruleHash,
        rules,
        goodExamples,
        badExamples,
        examples: [...goodExamples, ...badExamples],
    };
};

const normalizeInputSetPayload = async (body, { excludeId } = {}) => {
    const name = body.name.trim();
    const client = body.client.trim();
    const createdBy = body.createdBy?.trim() || undefined;

    await assertClientExists(client);
    await assertUniqueName(name, excludeId);

    const { ids: clientRulesIds, ruleHash } = await assertRulesForClient(
        client,
        body.clientRulesIds ?? []
    );
    const { goodExampleImageIds, badExampleImageIds } = await partitionExampleIds(
        client,
        body.exampleImageIds ?? []
    );

    return {
        name,
        client,
        createdBy,
        clientRulesIds,
        ruleHash,
        goodExampleImageIds,
        badExampleImageIds,
        notes: body.notes?.trim() || undefined,
    };
};

const listInputSets = async ({ client, status, q, pageNum, pageSize }) => {
    const filter = {};

    if (client) {
        filter.client = client.trim();
    }

    if (status) {
        const value = status.trim();
        if (!INPUT_SET_STATUSES.includes(value)) {
            throw new Api400Error(`Invalid status: ${value}`);
        }
        filter.status = value;
    }

    if (q) {
        const pattern = escapeRegex(q);
        filter.$or = [
            { name: { $regex: pattern, $options: 'i' } },
            { client: { $regex: pattern, $options: 'i' } },
        ];
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [data, total] = await Promise.all([
        InputSetModel.find(filter)
            .select({ name: 1, client: 1, status: 1, createdBy: 1, createdAt: 1 })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        InputSetModel.countDocuments(filter),
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

const getInputSetById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid input set id');
    }

    const doc = await InputSetModel.findById(id).lean();
    if (!doc) {
        throw new Api400Error(`Input set not found: ${id}`);
    }

    return buildInputSetDetail(doc);
};

const createInputSet = async (body) => {
    const payload = await normalizeInputSetPayload(body);

    try {
        const created = await InputSetModel.create({
            ...payload,
            status: 'draft',
        });

        return buildInputSetDetail(created.toObject());
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(`Input set name already exists: ${payload.name}`);
        }
        throw err;
    }
};

const updateInputSet = async (id, body) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid input set id');
    }

    const existing = await InputSetModel.findById(id).lean();
    if (!existing) {
        throw new Api400Error(`Input set not found: ${id}`);
    }

    if (existing.status !== 'draft') {
        throw new Api400Error('Only draft input sets can be edited');
    }

    const payload = await normalizeInputSetPayload(body, { excludeId: id });

    try {
        const updated = await InputSetModel.findByIdAndUpdate(
            id,
            { $set: payload },
            { new: true, runValidators: true }
        ).lean();

        return buildInputSetDetail(updated);
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(`Input set name already exists: ${payload.name}`);
        }
        throw err;
    }
};

const markInputSetActiveIfDraft = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid input set id');
    }

    const updated = await InputSetModel.findOneAndUpdate(
        { _id: id, status: 'draft' },
        { $set: { status: 'active' } },
        { new: true }
    ).lean();

    return updated;
};

const archiveInputSet = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid input set id');
    }

    const archived = await InputSetModel.findOneAndUpdate(
        { _id: id, status: { $ne: 'archive' } },
        { $set: { status: 'archive' } },
        { new: true }
    ).lean();

    if (!archived) {
        const exists = await InputSetModel.exists({ _id: id });
        if (!exists) {
            throw new Api400Error(`Input set not found: ${id}`);
        }
        throw new Api400Error('Input set is already archived');
    }

    return archived;
};

module.exports = {
    listInputSets,
    getInputSetById,
    createInputSet,
    updateInputSet,
    markInputSetActiveIfDraft,
    archiveInputSet,
};
