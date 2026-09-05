const mongoose = require('mongoose');
const stableStringify = require('json-stable-stringify');
const FrameworkVocabModel = require('../models/FrameworkVocab.model');
const Api400Error = require('../errors/api400Error');
const { GetMD5Hash } = require('../utils/crypto');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');

const computeContentHash = async (vocab) => {
    const canonical = stableStringify(vocab);
    return GetMD5Hash(canonical);
};

const listFrameworkVocabs = async ({ q, pageNum, pageSize }) => {
    const filter = {};

    if (q) {
        const pattern = escapeRegex(q);
        filter.$or = [
            { name: { $regex: pattern, $options: 'i' } },
            { contentHash: { $regex: pattern, $options: 'i' } },
        ];
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [data, total] = await Promise.all([
        FrameworkVocabModel.find(filter)
            .select('-vocab')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        FrameworkVocabModel.countDocuments(filter),
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

const getFrameworkVocabById = async (id, { includeVocab = true } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid framework vocab id');
    }

    const projection = includeVocab ? undefined : { vocab: 0 };
    const doc = await FrameworkVocabModel.findById(id, projection).lean();
    if (!doc) {
        throw new Api400Error(`Framework vocab not found: ${id}`);
    }
    return doc;
};

const createFrameworkVocab = async ({ name, vocab }) => {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
        throw new Api400Error('Name is required');
    }

    const contentHash = await computeContentHash(vocab);

    const created = await FrameworkVocabModel.create({
        name: trimmedName,
        vocab,
        contentHash,
    });

    return created.toObject ? created.toObject() : created;
};

const deleteFrameworkVocab = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid framework vocab id');
    }

    const deleted = await FrameworkVocabModel.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new Api400Error(`Framework vocab not found: ${id}`);
    }

    return deleted;
};

module.exports = {
    computeContentHash,
    listFrameworkVocabs,
    getFrameworkVocabById,
    createFrameworkVocab,
    deleteFrameworkVocab,
};
