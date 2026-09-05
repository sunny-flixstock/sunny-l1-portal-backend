const { escapeRegex } = require('./regex');

const buildRegexFilter = (val) => {
    if (Array.isArray(val)) {
        return { $in: val.map((v) => new RegExp(escapeRegex(v), 'i')) };
    }
    return { $regex: escapeRegex(val), $options: 'i' };
};

// Missing/empty FX_Shoot Type passes; known bad ingest values are excluded.
const EXCLUDED_DAR_SCAN_SHOOT_TYPES = Object.freeze(['DAR_SCAN', 'DAR_Scan']);

const EXCLUDE_DAR_SCAN_SHOOT_TYPE = {
    'patternDict.FX_Shoot Type': { $nin: [...EXCLUDED_DAR_SCAN_SHOOT_TYPES] },
};

const EXCLUDE_DAR_SCAN_SHOOT_TYPE_SQL = `COALESCE(jsonb_extract_path_text(metadata, 'patternDict', 'FX_Shoot Type'), '') NOT IN (${EXCLUDED_DAR_SCAN_SHOOT_TYPES.map((v) => `'${v.replace(/'/g, "''")}'`).join(', ')})`;

module.exports = {
    buildRegexFilter,
    EXCLUDE_DAR_SCAN_SHOOT_TYPE,
    EXCLUDE_DAR_SCAN_SHOOT_TYPE_SQL,
};
