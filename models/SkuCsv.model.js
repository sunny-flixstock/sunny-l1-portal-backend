const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const SkuCsvSchema = new mongoose.Schema(
    {
        barcode: { type: String, required: true, trim: true },
        clientName: { type: String, required: true, trim: true },
        csv: {
            csvData: { type: Object, default: {} },
            csvIngestionId: { type: mongoose.Schema.Types.ObjectId, ref: 'csvIngestion' },
            ingestedAt: { type: Date },
        },
        isActive: { type: Boolean, default: true },
        shouldNotProduce: { type: Boolean, default: false },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true,
        },
    }
);

SkuCsvSchema.index({ barcode: 1, clientName: 1 }, { unique: true });

const SkuCsvModel = addModel('skuCsv', SkuCsvSchema, 'SkuCsv');

module.exports = SkuCsvModel;
