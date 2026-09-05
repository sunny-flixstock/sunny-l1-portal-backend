const mongoose = require('mongoose');
const stableStringify = require('json-stable-stringify');
const CategoryRegistryModel = require('../models/CategoryRegistry.model');
const Api400Error = require('../errors/api400Error');
const { GetMD5Hash } = require('../utils/crypto');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');

const computeContentHash = async (registry) => {
    const canonical = stableStringify(registry);
    return GetMD5Hash(canonical);
};

const listCategoryRegistries = async ({ q, pageNum, pageSize }) => {
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
        CategoryRegistryModel.find(filter)
            .select('-registry')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        CategoryRegistryModel.countDocuments(filter),
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

const getCategoryRegistryById = async (id, { includeRegistry = true } = {}) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid category registry id');
    }

    const projection = includeRegistry ? undefined : { registry: 0 };
    const doc = await CategoryRegistryModel.findById(id, projection).lean();
    if (!doc) {
        throw new Api400Error(`Category registry not found: ${id}`);
    }
    return doc;
};

const createCategoryRegistry = async ({ name, registry }) => {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
        throw new Api400Error('Name is required');
    }

    const contentHash = await computeContentHash(registry);

    const created = await CategoryRegistryModel.create({
        name: trimmedName,
        registry,
        contentHash,
    });

    return created.toObject ? created.toObject() : created;
};

const deleteCategoryRegistry = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid category registry id');
    }

    const deleted = await CategoryRegistryModel.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new Api400Error(`Category registry not found: ${id}`);
    }

    return deleted;
};

module.exports = {
    computeContentHash,
    listCategoryRegistries,
    getCategoryRegistryById,
    createCategoryRegistry,
    deleteCategoryRegistry,
};
