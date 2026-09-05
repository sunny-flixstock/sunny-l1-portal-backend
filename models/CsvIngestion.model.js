const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const CsvIngestionSchema = new mongoose.Schema(
    {
        fileName: { type: String, required: true },
        clientName: { type: String, required: true },
        status: { type: String, enum: ['completed', 'failed', 'pending'], default: 'pending' },
        stats: {
            skusTotal: { type: Number },
            skusIdentified: { type: Number },
            skusNew: { type: Number },
        },
        failureReason: { type: String },
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true,
        },
    }
);

const CsvIngestionModel = addModel('csvIngestion', CsvIngestionSchema, 'CsvIngestion');

module.exports = CsvIngestionModel;
