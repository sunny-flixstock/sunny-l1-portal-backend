const AnglePresetModel = require('../models/AnglePreset.model');
const AngleTechnicalSpecificationModel = require('../models/AngleTechnicalSpecification.model');
const ClientAngleModel = require('../models/ClientAngle.model');
const BaseAngleModel = require('../models/BaseAngle.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { enrichClientAngle, enrichBaseAngle } = require('../utils/angleImages');
const { getUrlFromKey } = require('../utils/CloudFront.s3');

const refreshDefinitionStorageUrl = (storage) => {
    if (!storage?.bucket || !storage?.key) {
        return storage ?? null;
    }
    try {
        const { url } = getUrlFromKey(storage.key, undefined, storage.bucket);
        return { ...storage, url };
    } catch {
        return storage;
    }
};

const enrichClientAngleForPartner = (doc) => {
    if (!doc) return null;
    const enriched = enrichClientAngle(doc);
    return {
        ...enriched,
        definitionStorage: refreshDefinitionStorageUrl(enriched.definitionStorage),
    };
};

const enrichBaseAngleForPartner = (doc) => {
    if (!doc) return null;
    const enriched = enrichBaseAngle(doc);
    return {
        ...enriched,
        definitionStorage: refreshDefinitionStorageUrl(enriched.definitionStorage),
    };
};

const enrichPresetForPartner = async (doc) => {
    if (!doc) return doc;

    const clientAngleIds = doc.entries.map((entry) => entry.clientAngleId);
    const specIds = doc.entries.flatMap((entry) =>
        entry.imageSpecs.map((spec) => spec.angleTechnicalSpecificationId)
    );

    const [clientAngles, specs] = await Promise.all([
        ClientAngleModel.find({ _id: { $in: clientAngleIds } }).lean(),
        AngleTechnicalSpecificationModel.find({ _id: { $in: specIds } }).lean(),
    ]);

    const baseAngleIds = [...new Set(clientAngles.map((angle) => String(angle.baseAngleId)))];
    const baseAngles = baseAngleIds.length
        ? await BaseAngleModel.find({ _id: { $in: baseAngleIds } }).lean()
        : [];

    const clientAngleMap = new Map(
        clientAngles.map((angle) => [String(angle._id), enrichClientAngleForPartner(angle)])
    );
    const specMap = new Map(specs.map((spec) => [String(spec._id), spec]));
    const baseAngleMap = new Map(
        baseAngles.map((angle) => [String(angle._id), enrichBaseAngleForPartner(angle)])
    );

    return {
        _id: doc._id,
        name: doc.name,
        client: doc.client,
        angles: doc.entries.map((entry) => {
            const clientAngle = clientAngleMap.get(String(entry.clientAngleId)) ?? null;
            const baseAngle = clientAngle?.baseAngleId
                ? baseAngleMap.get(String(clientAngle.baseAngleId)) ?? null
                : null;

            return {
                clientAngleId: entry.clientAngleId,
                clientAngle: clientAngle
                    ? {
                        _id: clientAngle._id,
                        name: clientAngle.name,
                        client: clientAngle.client,
                        seriesKey: clientAngle.seriesKey,
                        version: clientAngle.version,
                        status: clientAngle.status,
                        baseAngleId: clientAngle.baseAngleId,
                        baseAngleSeriesKey: clientAngle.baseAngleSeriesKey,
                        referenceImages: clientAngle.referenceImages ?? [],
                        definitionStorage: clientAngle.definitionStorage ?? null
                    }
                    : null,
                imageSpecs: entry.imageSpecs.map((imageSpec) => ({
                    angleTechnicalSpecificationId: imageSpec.angleTechnicalSpecificationId,
                    namingPattern: imageSpec.namingPattern,
                    angleTechnicalSpecification:
                        specMap.get(String(imageSpec.angleTechnicalSpecificationId)) ?? null,
                })),
            };
        }),
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
};

const listAnglePresetsForPartner = async ({ clientName }) => {
    const client = clientName?.trim();
    if (!client) {
        throw new Api400Error('clientName is required');
    }

    const exists = await ClientModel.exists({ code: client });
    if (!exists) {
        throw new Api400Error(`Client not found: ${client}`);
    }

    const presets = await AnglePresetModel.find({ client })
        .sort({ updatedAt: -1 })
        .lean();

    const data = await Promise.all(presets.map((doc) => enrichPresetForPartner(doc)));

    return { data };
};

module.exports = {
    listAnglePresetsForPartner,
};
