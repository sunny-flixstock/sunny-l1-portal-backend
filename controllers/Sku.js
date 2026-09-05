const { parseCSV, validateRows } = require('../services/csv.service');
const { upsertFromCsv, searchSkus, getSkuStatsByClient, getSkuById, getSkuByClientAndBarcode, lookupSkuByClientAndBarcode, setSkuShouldNotProduce, aggregateSkus } = require('../services/sku.service');
const { searchSkusFuzzyWithAssets } = require('../services/assetSemanticSearch.service');
const CsvIngestionModel = require('../models/CsvIngestion.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');

const importCsv = async (req, res, next) => {
    let ingestion = null;
    try {
        const { clientName } = req.query;

        if (!req.file) {
            throw new Api400Error('No file uploaded. Send a CSV in the "file" field.');
        }

        let rows;
        try {
            rows = parseCSV(req.file.buffer);
        } catch (parseErr) {
            throw new Api400Error(`CSV parse error: ${parseErr.message}`);
        }

        const client = await ClientModel.findOne({ code: clientName }).lean();
        const { isValid, errors, duplicateBarcodes, rows: normalisedRows } = validateRows(rows, client?.csvConfig);
        if (!isValid) {
            throw new Api400Error('Validation failed', { errors });
        }
        rows = normalisedRows;

        ingestion = await CsvIngestionModel.create({
            fileName: req.file.originalname,
            clientName,
            status: 'pending',
        });

        const { upsertedCount, modifiedCount } = await upsertFromCsv({ rows, ingestion, clientName });

        const stats = {
            skusTotal: rows.length,
            skusIdentified: modifiedCount,
            skusNew: upsertedCount,
            duplicateBarcodes,
        };

        await CsvIngestionModel.findByIdAndUpdate(ingestion._id, {
            status: 'completed',
            stats,
        });

        return res.status(200).json({
            message: 'CSV imported successfully',
            ingestionId: ingestion._id,
            stats,
        });
    } catch (err) {
        if (ingestion) {
            await CsvIngestionModel.findByIdAndUpdate(ingestion._id, {
                status: 'failed',
                failureReason: err.message,
            }).catch((updateErr) => {
                console.error('Failed to update ingestion status to failed:', updateErr.message);
            });
        }
        next(err);
    }
};

const search = async (req, res, next) => {
    try {
        const result = await searchSkus(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getStatsByClient = async (req, res, next) => {
    try {
        const result = await getSkuStatsByClient();
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const data = await getSkuById(req.params.id);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getByClientAndBarcode = async (req, res, next) => {
    try {
        const data = await getSkuByClientAndBarcode(req.query);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const lookupByClientAndBarcode = async (req, res, next) => {
    try {
        const data = await getSkuByClientAndBarcode(req.query);
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const semanticSearchPartner = async (req, res, next) => {
    try {
        const result = await searchSkusFuzzyWithAssets(req.query, { usePartnerEmbedding: true });
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const doNotProduce = async (req, res, next) => {
    try {
        const result = await setSkuShouldNotProduce(req.body);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const aggregate = async (req, res, next) => {
    try {
        const result = await aggregateSkus(req.body.pipeline);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const saveCsvData = async (req, res, next) => {
    try {
        const { barcode, clientName, csvData } = req.body;

        const client = await ClientModel.findOne({ code: clientName }).lean();
        const { isValid, errors, rows: normalisedRows } = validateRows([{ barcode, ...csvData }], client?.csvConfig);
        if (!isValid) {
            throw new Api400Error('Validation failed', { errors });
        }
        const { upsertedCount, modifiedCount } = await upsertFromCsv({ rows: normalisedRows, clientName });
        // single-row endpoint: normalisedRows always has exactly one entry; trim to match what upsertFromCsv persists
        return res.status(200).json({
            result: {
                barcode: normalisedRows[0].barcode.trim(),
                created: !!upsertedCount,
                modified: !!modifiedCount,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { importCsv, search, getStatsByClient, getById, getByClientAndBarcode, lookupByClientAndBarcode, semanticSearchPartner, doNotProduce, saveCsvData, aggregate };
