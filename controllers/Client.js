const {
    listAllClients,
    listClients,
    getClientByCode,
    createClient,
    updateEnableFXGTOM,
    updateCsvConfig,
} = require('../services/client.service');
const Api400Error = require('../errors/api400Error');

const getAllClients = async (req, res, next) => {
    try {
        const result = await listAllClients(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getClients = async (req, res, next) => {
    try {
        const { q, pageNum, pageSize } = req.query;
        const result = await listClients({ q, pageNum, pageSize });
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getClient = async (req, res, next) => {
    try {
        const client = await getClientByCode(req.params.code);
        return res.status(200).json({ data: client });
    } catch (err) {
        next(err);
    }
};

const postClient = async (req, res, next) => {
    try {
        const { client, created } = await createClient(req.body);
        if (!created) throw new Api400Error(`Client already exists: ${client.code}`);
        return res.status(201).json({ data: client });
    } catch (err) {
        next(err);
    }
};

const postBulkClients = async (req, res, next) => {
    try {
        const data = await Promise.all(
            req.body.clients.map(async (input) => {
                try {
                    const { client, created } = await createClient(input);
                    return { code: client.code, status: created ? 'created' : 'existed' };
                } catch (err) {
                    return { code: input?.code, status: 'error', error: err.message };
                }
            })
        );
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const patchEnableFXGTOM = async (req, res, next) => {
    try {
        const client = await updateEnableFXGTOM(req.params.code, req.body.enableFXGTOM);
        return res.status(200).json({ data: client });
    } catch (err) {
        next(err);
    }
};

const patchCsvConfig = async (req, res, next) => {
    try {
        const client = await updateCsvConfig(req.params.code, req.body.csvConfig);
        return res.status(200).json({ data: client });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllClients,
    getClients,
    getClient,
    postClient,
    postBulkClients,
    patchEnableFXGTOM,
    patchCsvConfig,
};
