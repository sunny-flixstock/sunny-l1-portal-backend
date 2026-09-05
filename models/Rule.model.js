const { addModel } = require('../startup/db');
const mongoose = require('mongoose');
const { DOMAINS } = require('../utils/domains');

const RULE_POLARITIES = Object.freeze(['must_do', 'must_not_do', 'prefer', 'avoid']);

const RULE_PRIORITIES = Object.freeze(['low', 'medium', 'high', 'critical']);

const RULE_SOURCES = Object.freeze(['client_defined', 'internal']);

const RuleSchema = new mongoose.Schema(
    {
        client: { type: String, required: true, trim: true },
        ruleType: {
            type: String,
            enum: DOMAINS,
            required: true,
        },
        polarity: {
            type: String,
            enum: RULE_POLARITIES,
            required: true,
        },
        ruleText: { type: String, required: true, trim: true },
        priority: {
            type: String,
            enum: RULE_PRIORITIES,
            required: true,
        },
        source: {
            type: String,
            enum: RULE_SOURCES,
            required: true,
        },
        createdBy: { type: String, trim: true },
        tags: {
            type: [{ type: String, trim: true }],
            default: [],
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

RuleSchema.index({ client: 1, createdAt: -1 });
RuleSchema.index({ client: 1, ruleType: 1 });
RuleSchema.index({ client: 1, polarity: 1 });
RuleSchema.index({ client: 1, priority: 1 });
RuleSchema.index({ client: 1, source: 1 });
RuleSchema.index({ client: 1, tags: 1 });

const RuleModel = addModel('rule', RuleSchema, 'Rule');

module.exports = RuleModel;
module.exports.RULE_TYPES = DOMAINS;
module.exports.RULE_POLARITIES = RULE_POLARITIES;
module.exports.RULE_PRIORITIES = RULE_PRIORITIES;
module.exports.RULE_SOURCES = RULE_SOURCES;
