const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const CsvColumnRuleSchema = new mongoose.Schema(
    {
        sources: { type: [String], default: undefined },
        required: { type: Boolean, default: false },
        allowedValues: { type: [String], default: undefined },
    },
    { _id: false }
);

const ClientSchema = new mongoose.Schema(
    {
        code: { type: String, required: true, unique: true, trim: true },
        displayName: { type: String, trim: true },
        enableFXGTOM: { type: Boolean, default: false },
        skuSeq: { type: Number, default: 0 },
        csvConfig: {
            columns: { type: Map, of: CsvColumnRuleSchema, default: {} },
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: true },
    }
);

const ClientModel = addModel('client', ClientSchema, 'Client');

const nextSkuSeq = async (code) => {
    const doc = await ClientModel.findOneAndUpdate(
        { code },
        { $inc: { skuSeq: 1 }, $setOnInsert: { code } },
        { new: true, upsert: true }
    );
    return doc.skuSeq;
};

module.exports = ClientModel;
module.exports.nextSkuSeq = nextSkuSeq;
