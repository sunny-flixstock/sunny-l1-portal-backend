const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const INPUT_SET_STATUSES = Object.freeze(['draft', 'active', 'archive']);

const InputSetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        client: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: INPUT_SET_STATUSES,
            default: 'draft',
            required: true,
        },
        goodExampleImageIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'exampleImage' }],
            default: [],
        },
        badExampleImageIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'exampleImage' }],
            default: [],
        },
        clientRulesIds: {
            type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'rule' }],
            default: [],
        },
        ruleHash: {
            type: Map,
            of: String,
            default: () => new Map(),
        },
        createdBy: { type: String, trim: true },
        notes: { type: String, trim: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

InputSetSchema.index({ name: 1 }, { unique: true });
InputSetSchema.index({ client: 1, createdAt: -1 });
InputSetSchema.index({ status: 1, createdAt: -1 });

const InputSetModel = addModel('inputSet', InputSetSchema, 'InputSet');

module.exports = InputSetModel;
module.exports.INPUT_SET_STATUSES = INPUT_SET_STATUSES;
