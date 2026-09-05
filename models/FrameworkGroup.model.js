const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const CONSTRAINT_FIELDS = Object.freeze(['gender', 'season', 'category']);

const normalizeConstraintValue = (value) => {
    if (value == null) return null;
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
};

const normalizeClient = (client) => {
    const normalized = normalizeConstraintValue(client);
    if (!normalized) {
        throw new Error('client is required');
    }
    return normalized;
};

const computeSpecificity = (constraints) =>
    CONSTRAINT_FIELDS.reduce(
        (count, field) => count + (constraints[field] != null ? 1 : 0),
        0
    );

const normalizeGroupParams = ({
    client,
    gender,
    season,
    category,
    priority = 0,
    name,
}) => {
    const normalized = {
        client: normalizeClient(client),
        gender: normalizeConstraintValue(gender),
        season: normalizeConstraintValue(season),
        category: normalizeConstraintValue(category),
        priority: Number.isFinite(priority) ? priority : 0,
    };

    if (name != null) {
        const trimmedName = String(name).trim();
        if (trimmedName !== '') {
            normalized.name = trimmedName;
        }
    }

    normalized.specificity = computeSpecificity(normalized);
    return normalized;
};

const normalizeResolveContext = ({ client, gender, season, category }) => ({
    client: normalizeClient(client),
    gender: normalizeConstraintValue(gender),
    season: normalizeConstraintValue(season),
    category: normalizeConstraintValue(category),
});

/**
 * A group matches when every constrained dimension equals the request context.
 * Null/omitted dimensions on the group are wildcards. Missing context for a
 * constrained dimension does not match (strict resolution).
 */
const matchesContext = (context, group) => {
    for (const field of CONSTRAINT_FIELDS) {
        const groupValue = group[field];
        if (groupValue == null) continue;

        const contextValue = context[field];
        if (contextValue == null) return false;
        if (contextValue !== groupValue) return false;
    }
    return true;
};

const compareGroupsForResolution = (a, b) => {
    if (b.specificity !== a.specificity) {
        return b.specificity - a.specificity;
    }
    return (b.priority ?? 0) - (a.priority ?? 0);
};

const FrameworkGroupSchema = new mongoose.Schema(
    {
        client: { type: String, required: true, trim: true },
        gender: { type: String, default: null, trim: true },
        season: { type: String, default: null, trim: true },
        category: { type: String, default: null, trim: true },
        priority: { type: Number, default: 0 },
        specificity: { type: Number, required: true, min: 0, max: CONSTRAINT_FIELDS.length },
        name: { type: String, trim: true },
        versionSequence: { type: Number, default: 0, min: 0 },
        activeProductionFrameworkVersionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'frameworkVersion',
            default: null,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: true },
    }
);

FrameworkGroupSchema.index(
    { client: 1, gender: 1, season: 1, category: 1 },
    { unique: true }
);
FrameworkGroupSchema.index({ client: 1, specificity: -1 });

FrameworkGroupSchema.pre('validate', function setSpecificity() {
    this.gender = normalizeConstraintValue(this.gender);
    this.season = normalizeConstraintValue(this.season);
    this.category = normalizeConstraintValue(this.category);
    this.specificity = computeSpecificity(this);
});

/**
 * Create a framework group for a client + optional constraint dimensions.
 * Duplicate constraint signatures raise a descriptive error.
 */
FrameworkGroupSchema.statics.createGroup = async function (params) {
    const doc = normalizeGroupParams(params);

    try {
        return await this.create(doc);
    } catch (err) {
        if (err?.code === 11000) {
            throw new Error(
                `Framework group already exists for client "${doc.client}" with the same constraints`
            );
        }
        throw err;
    }
};

/**
 * Resolve the best-matching framework group for a request context.
 * Returns null when no group matches.
 */
FrameworkGroupSchema.statics.resolveGroup = async function (context) {
    const normalizedContext = normalizeResolveContext(context);
    const groups = await this.find({ client: normalizedContext.client }).lean();

    const matches = groups.filter((group) => matchesContext(normalizedContext, group));
    if (matches.length === 0) {
        return null;
    }

    matches.sort(compareGroupsForResolution);
    return matches[0];
};

/**
 * List all framework groups for a client, most specific first.
 */
FrameworkGroupSchema.statics.findByClient = function (client, { lean = true } = {}) {
    const normalizedClient = normalizeClient(client);
    const query = this.find({ client: normalizedClient }).sort({
        specificity: -1,
        priority: -1,
        createdAt: -1,
    });
    return lean ? query.lean() : query;
};

/**
 * Fetch a single group by id.
 */
FrameworkGroupSchema.statics.getById = function (id, { lean = true } = {}) {
    const query = this.findById(id);
    return lean ? query.lean() : query;
};

const FrameworkGroupModel = addModel('frameworkGroup', FrameworkGroupSchema, 'FrameworkGroup');

module.exports = FrameworkGroupModel;
module.exports.CONSTRAINT_FIELDS = CONSTRAINT_FIELDS;
module.exports.normalizeConstraintValue = normalizeConstraintValue;
module.exports.computeSpecificity = computeSpecificity;
module.exports.normalizeGroupParams = normalizeGroupParams;
module.exports.normalizeResolveContext = normalizeResolveContext;
module.exports.matchesContext = matchesContext;
module.exports.compareGroupsForResolution = compareGroupsForResolution;
