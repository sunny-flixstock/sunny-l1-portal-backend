const mongoose = require('mongoose');
const FrameworkGroupModel = require('../models/FrameworkGroup.model');
const { normalizeGroupParams } = require('../models/FrameworkGroup.model');
const FrameworkVersionModel = require('../models/FrameworkVersion.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');

const listFrameworkGroups = async ({ client, gender, season, category, q, pageNum, pageSize }) => {
    const filter = {};

    if (client) {
        filter.client = client.trim();
    }
    if (gender) {
        filter.gender = gender.trim();
    }
    if (season) {
        filter.season = season.trim();
    }
    if (category) {
        filter.category = category.trim();
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
        FrameworkGroupModel.find(filter)
            .sort({ client: 1, specificity: -1, priority: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        FrameworkGroupModel.countDocuments(filter),
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

const getFrameworkGroupById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid framework group id');
    }

    const group = await FrameworkGroupModel.getById(id);
    if (!group) {
        throw new Api400Error(`Framework group not found: ${id}`);
    }
    return group;
};

const createFrameworkGroup = async (params) => {
    try {
        const group = await FrameworkGroupModel.createGroup(params);
        return group.toObject ? group.toObject() : group;
    } catch (err) {
        if (err?.code === 11000 || err.message?.includes('already exists')) {
            throw new Api400Error(err.message);
        }
        throw err;
    }
};

const updateFrameworkGroup = async (id, params) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid framework group id');
    }

    const existing = await FrameworkGroupModel.findById(id);
    if (!existing) {
        throw new Api400Error(`Framework group not found: ${id}`);
    }

    const doc = normalizeGroupParams({
        client: params.client ?? existing.client,
        gender: params.gender !== undefined ? params.gender : existing.gender,
        season: params.season !== undefined ? params.season : existing.season,
        category: params.category !== undefined ? params.category : existing.category,
        priority: params.priority !== undefined ? params.priority : existing.priority,
        name: params.name !== undefined ? params.name : existing.name,
    });

    try {
        const updated = await FrameworkGroupModel.findByIdAndUpdate(
            id,
            { $set: doc },
            { new: true, runValidators: true }
        ).lean();

        return updated;
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(
                `Framework group already exists for client "${doc.client}" with the same constraints`
            );
        }
        throw err;
    }
};

const deleteFrameworkGroup = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid framework group id');
    }

    const versionCount = await FrameworkVersionModel.countDocuments({ frameworkGroupId: id });
    if (versionCount > 0) {
        throw new Api400Error(
            `Cannot delete framework group: ${versionCount} framework version(s) still reference it`
        );
    }

    const deleted = await FrameworkGroupModel.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new Api400Error(`Framework group not found: ${id}`);
    }

    return deleted;
};

module.exports = {
    listFrameworkGroups,
    getFrameworkGroupById,
    createFrameworkGroup,
    updateFrameworkGroup,
    deleteFrameworkGroup,
};
