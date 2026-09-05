const ClientModel = require('../models/Client.model');
const SkuModel = require('../models/Sku.model');
const Api400Error = require('../errors/api400Error');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');

const CLIENT_PROJECTION = { code: 1, displayName: 1, enableFXGTOM: 1 };

const createClient = async ({ code, displayName, enableFXGTOM } = {}) => {
    const trimmedCode = code?.trim();
    if (!trimmedCode) throw new Api400Error('Client code is required');

    const setOnInsert = { code: trimmedCode };
    if (displayName) setOnInsert.displayName = displayName;
    if (typeof enableFXGTOM === 'boolean') setOnInsert.enableFXGTOM = enableFXGTOM;

    const result = await ClientModel.findOneAndUpdate(
        { code: trimmedCode },
        { $setOnInsert: setOnInsert },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true,
            includeResultMetadata: true,
            projection: CLIENT_PROJECTION,
        }
    );
    return { client: result.value, created: !result.lastErrorObject.updatedExisting };
};

const patchClient = async (code, update) => {
    const client = await ClientModel.findOneAndUpdate(
        { code },
        { $set: update },
        { new: true, runValidators: true, projection: { ...CLIENT_PROJECTION, csvConfig: 1 } }
    ).lean();
    if (!client) throw new Api400Error(`Client not found: ${code}`);
    return client;
};

const listAllClients = async ({ q } = {}) => {
    const filter = q ? { code: { $regex: escapeRegex(q), $options: 'i' } } : {};
    const clients = await ClientModel.find(filter, CLIENT_PROJECTION).sort({ code: 1 }).lean();
    return { data: clients, total: clients.length };
};

const listClients = async ({ q, pageNum, pageSize }) => {
    const filter = q ? { code: { $regex: escapeRegex(q), $options: 'i' } } : {};
    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });

    const [clients, total] = await Promise.all([
        ClientModel.find(filter, CLIENT_PROJECTION).sort({ code: 1 }).skip(skip).limit(limit).lean(),
        ClientModel.countDocuments(filter),
    ]);

    return {
        data: clients,
        pagination: {
            total,
            pageNum: parseInt(pageNum) || 1,
            pageSize: limit,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

const getClientByCode = async (code) => {
    const client = await ClientModel.findOne({ code }, { ...CLIENT_PROJECTION, csvConfig: 1 }).lean();
    if (!client) throw new Api400Error(`Client not found: ${code}`);
    return client;
};

const ensureClient = (code) => createClient({ code });

// Safety buffer before a SKU's ingestion fires. If `now` hasn't yet reached
// `ingestionScheduledAt - DISABLE_GRACE_MS`, we still have time to cancel — flip enableFXGTOM:false
// and the sweep will skip it. If `now` is already inside the buffer (or past the schedule),
// the sweep is about to pick it; let it run rather than racing.
const DISABLE_GRACE_MS = 10_000;

const updateEnableFXGTOM = async (code, enableFXGTOM) => {
    const client = await patchClient(code, { enableFXGTOM });

    if (enableFXGTOM === false) {
        // Disable a SKU only when `now < ingestionScheduledAt - DISABLE_GRACE_MS` — i.e. we still
        // have at least DISABLE_GRACE_MS of buffer before the sweep would pick it up. SKUs already
        // inside the buffer (or overdue) keep running and finish their current sweep cycle.
        const cutoff = new Date(Date.now() + DISABLE_GRACE_MS);
        const { modifiedCount } = await SkuModel.updateMany(
            { clientName: code, ingestionScheduledAt: { $gt: cutoff } },
            { $set: { enableFXGTOM: false } }
        );
        return { ...client, skusUpdated: modifiedCount, skusScheduled: 0 };
    } else {
        // Broad enable: flip every SKU back to true so previously-disabled ones rejoin the sweep,
        // then bump ingestionScheduledAt:now on every un-embedded SKU for backfill. This intentionally
        // re-triggers any historically un-embedded SKU (legacy, failed pipeline, in-flight) — narrower
        // scoping (e.g. only enableFXGTOM:false SKUs) can be added later when policy gets richer.
        const { modifiedCount } = await SkuModel.updateMany(
            { clientName: code },
            { $set: { enableFXGTOM: true } }
        );
        const { modifiedCount: scheduled } = await SkuModel.updateMany(
            { clientName: code, isActive: true, embeddingDone: { $ne: true } },
            { $set: { ingestionScheduledAt: new Date() } }
        );
        return { ...client, skusUpdated: modifiedCount, skusScheduled: scheduled };
    }
};
const updateCsvConfig = (code, csvConfig) => patchClient(code, { csvConfig });

module.exports = {
    listAllClients,
    listClients,
    getClientByCode,
    createClient,
    ensureClient,
    updateEnableFXGTOM,
    updateCsvConfig,
};
