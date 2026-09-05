const mongoose = require('mongoose');
const AnglePresetModel = require('../models/AnglePreset.model');
const AngleTechnicalSpecificationModel = require('../models/AngleTechnicalSpecification.model');
const ClientAngleModel = require('../models/ClientAngle.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');

const assertClientExists = async (client) => {
    const exists = await ClientModel.exists({ code: client });
    if (!exists) {
        throw new Api400Error(`Client not found: ${client}`);
    }
};

const validateEntries = async (client, entries) => {
    const clientAngleIds = [...new Set(entries.map((entry) => String(entry.clientAngleId)))];
    const specIds = [
        ...new Set(
            entries.flatMap((entry) =>
                entry.imageSpecs.map((spec) => String(spec.angleTechnicalSpecificationId))
            )
        ),
    ];

    const [clientAngles, specs] = await Promise.all([
        ClientAngleModel.find({ _id: { $in: clientAngleIds } })
            .select({ _id: 1, client: 1, name: 1, status: 1 })
            .lean(),
        AngleTechnicalSpecificationModel.find({ _id: { $in: specIds } })
            .select({ _id: 1, client: 1, name: 1 })
            .lean(),
    ]);

    const clientAngleMap = new Map(clientAngles.map((doc) => [String(doc._id), doc]));
    const specMap = new Map(specs.map((doc) => [String(doc._id), doc]));

    for (const entry of entries) {
        const clientAngle = clientAngleMap.get(String(entry.clientAngleId));
        if (!clientAngle) {
            throw new Api400Error(`Client angle not found: ${entry.clientAngleId}`);
        }
        if (clientAngle.client !== client) {
            throw new Api400Error(
                `Client angle "${clientAngle.name}" does not belong to client ${client}`
            );
        }
        if (clientAngle.status !== 'active') {
            throw new Api400Error(`Client angle "${clientAngle.name}" is not active`);
        }

        for (const imageSpec of entry.imageSpecs) {
            const spec = specMap.get(String(imageSpec.angleTechnicalSpecificationId));
            if (!spec) {
                throw new Api400Error(
                    `Angle technical specification not found: ${imageSpec.angleTechnicalSpecificationId}`
                );
            }
            if (spec.client !== client) {
                throw new Api400Error(
                    `Angle technical specification "${spec.name}" does not belong to client ${client}`
                );
            }
            if (!imageSpec.namingPattern?.trim()) {
                throw new Api400Error('Naming pattern is required for each image specification');
            }
        }
    }

    const duplicateAngles = clientAngleIds.filter(
        (id, index) => clientAngleIds.indexOf(id) !== index
    );
    if (duplicateAngles.length > 0) {
        throw new Api400Error('Each client angle can only appear once in a preset');
    }
};

const enrichPreset = async (doc) => {
    if (!doc) return doc;

    const clientAngleIds = doc.entries.map((entry) => entry.clientAngleId);
    const specIds = doc.entries.flatMap((entry) =>
        entry.imageSpecs.map((spec) => spec.angleTechnicalSpecificationId)
    );

    const [clientAngles, specs] = await Promise.all([
        ClientAngleModel.find({ _id: { $in: clientAngleIds } })
            .select({ name: 1, seriesKey: 1, baseAngleSeriesKey: 1, client: 1, version: 1 })
            .lean(),
        AngleTechnicalSpecificationModel.find({ _id: { $in: specIds } }).lean(),
    ]);

    const clientAngleMap = new Map(clientAngles.map((angle) => [String(angle._id), angle]));
    const specMap = new Map(specs.map((spec) => [String(spec._id), spec]));

    return {
        ...doc,
        entries: doc.entries.map((entry) => ({
            ...entry,
            clientAngle: clientAngleMap.get(String(entry.clientAngleId)) ?? null,
            imageSpecs: entry.imageSpecs.map((imageSpec) => ({
                ...imageSpec,
                angleTechnicalSpecification:
                    specMap.get(String(imageSpec.angleTechnicalSpecificationId)) ?? null,
            })),
        })),
    };
};

const listAnglePresets = async ({ client, q, pageNum, pageSize }) => {
    const filter = {};

    if (client) {
        filter.client = client;
    }

    if (q) {
        const pattern = escapeRegex(q);
        filter.name = { $regex: pattern, $options: 'i' };
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [data, total] = await Promise.all([
        AnglePresetModel.find(filter)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AnglePresetModel.countDocuments(filter),
    ]);

    const enriched = await Promise.all(data.map((doc) => enrichPreset(doc)));

    return {
        data: enriched,
        pagination: {
            total,
            pageNum: resolvedPageNum,
            pageSize: limit,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

const getAnglePresetById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid angle preset id');
    }

    const doc = await AnglePresetModel.findById(id).lean();
    if (!doc) {
        throw new Api400Error(`Angle preset not found: ${id}`);
    }

    return enrichPreset(doc);
};

const createAnglePreset = async ({ name, client, entries }) => {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
        throw new Api400Error('Name is required');
    }

    await assertClientExists(client);
    await validateEntries(client, entries);

    const existing = await AnglePresetModel.exists({ client, name: trimmedName });
    if (existing) {
        throw new Api400Error(`Angle preset already exists for client ${client}: ${trimmedName}`);
    }

    const created = await AnglePresetModel.create({
        name: trimmedName,
        client,
        entries,
    });

    return enrichPreset(created.toObject ? created.toObject() : created);
};

const updateAnglePreset = async (id, { name, entries }) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid angle preset id');
    }

    const existing = await AnglePresetModel.findById(id).lean();
    if (!existing) {
        throw new Api400Error(`Angle preset not found: ${id}`);
    }

    const updates = {};

    if (name !== undefined) {
        const trimmedName = String(name).trim();
        if (!trimmedName) {
            throw new Api400Error('Name is required');
        }
        if (trimmedName !== existing.name) {
            const nameTaken = await AnglePresetModel.exists({
                client: existing.client,
                name: trimmedName,
                _id: { $ne: id },
            });
            if (nameTaken) {
                throw new Api400Error(
                    `Angle preset already exists for client ${existing.client}: ${trimmedName}`
                );
            }
        }
        updates.name = trimmedName;
    }

    if (entries !== undefined) {
        await validateEntries(existing.client, entries);
        updates.entries = entries;
    }

    if (Object.keys(updates).length === 0) {
        return enrichPreset(existing);
    }

    const updated = await AnglePresetModel.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
    ).lean();

    return enrichPreset(updated);
};

const deleteAnglePreset = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid angle preset id');
    }

    const deleted = await AnglePresetModel.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new Api400Error(`Angle preset not found: ${id}`);
    }

    return deleted;
};

module.exports = {
    listAnglePresets,
    getAnglePresetById,
    createAnglePreset,
    updateAnglePreset,
    deleteAnglePreset,
};
