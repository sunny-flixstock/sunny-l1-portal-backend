const mongoose = require('mongoose');
const AngleTechnicalSpecificationModel = require('../models/AngleTechnicalSpecification.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');
const {
    COLOR_MODES,
    FILE_FORMATS,
    DEFAULT_BACKGROUND_COLOR,
    buildSpecPayload,
    computeSpecHash,
} = require('../utils/angleTechnicalSpec');

const assertClientExists = async (client) => {
    const exists = await ClientModel.exists({ code: client });
    if (!exists) {
        throw new Api400Error(`Client not found: ${client}`);
    }
};

const listAngleTechnicalSpecifications = async ({ client, q, pageNum, pageSize }) => {
    const filter = {};

    if (client) {
        filter.client = client;
    }

    if (q) {
        const pattern = escapeRegex(q);
        filter.$or = [
            { name: { $regex: pattern, $options: 'i' } },
            { specHash: { $regex: pattern, $options: 'i' } },
        ];
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [data, total] = await Promise.all([
        AngleTechnicalSpecificationModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        AngleTechnicalSpecificationModel.countDocuments(filter),
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

const getAngleTechnicalSpecificationById = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid angle technical specification id');
    }

    const doc = await AngleTechnicalSpecificationModel.findById(id).lean();
    if (!doc) {
        throw new Api400Error(`Angle technical specification not found: ${id}`);
    }
    return doc;
};

const createAngleTechnicalSpecification = async ({
    name,
    client,
    dimensions,
    background,
    fileSpecifications,
}) => {
    const trimmedName = String(name).trim();
    if (!trimmedName) {
        throw new Api400Error('Name is required');
    }

    await assertClientExists(client);

    const specPayload = buildSpecPayload({ dimensions, background, fileSpecifications });
    const specHash = await computeSpecHash(specPayload);

    const existing = await AngleTechnicalSpecificationModel.findOne({ client, specHash }).lean();
    if (existing) {
        return { ...existing, deduplicated: true };
    }

    const created = await AngleTechnicalSpecificationModel.create({
        name: trimmedName,
        client,
        dimensions: specPayload.dimensions,
        background: specPayload.background,
        fileSpecifications: specPayload.fileSpecifications,
        specHash,
    });

    return created.toObject ? created.toObject() : created;
};

const deleteAngleTechnicalSpecification = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error('Invalid angle technical specification id');
    }

    const deleted = await AngleTechnicalSpecificationModel.findByIdAndDelete(id).lean();
    if (!deleted) {
        throw new Api400Error(`Angle technical specification not found: ${id}`);
    }

    return deleted;
};

const getAngleTechnicalSpecificationMeta = () => ({
    colorModes: COLOR_MODES,
    fileFormats: FILE_FORMATS,
    defaultBackgroundColor: DEFAULT_BACKGROUND_COLOR,
});

module.exports = {
    listAngleTechnicalSpecifications,
    getAngleTechnicalSpecificationById,
    createAngleTechnicalSpecification,
    deleteAngleTechnicalSpecification,
    getAngleTechnicalSpecificationMeta,
};
