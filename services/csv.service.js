const { parse } = require('csv-parse/sync');

// ── Parser ────────────────────────────────────────────────────────────────────

const detectDelimiter = (raw) => {
    const firstLine = raw.split('\n')[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    return tabCount > commaCount ? '\t' : ',';
};

const parseCSV = (buffer) => {
    const raw = buffer.toString('utf-8');
    const delimiter = detectDelimiter(raw);
    return parse(raw, {
        columns: (headers) => headers.map((h) => (typeof h === 'string' ? h.trim() : h)),
        skip_empty_lines: true,
        trim: true,
        delimiter,
        relax_column_count: true,
    });
};

// ── Validation ────────────────────────────────────────────────────────────────

const toColumnEntries = (columns) => {
    if (!columns) return [];
    if (columns instanceof Map) return [...columns.entries()];
    return Object.entries(columns);
};

const compileRules = (csvConfig) => {
    const rules = toColumnEntries(csvConfig?.columns).map(([canonical, rule = {}]) => ({
        canonical,
        sources: rule.sources?.length ? rule.sources : [canonical],
        required: !!rule.required,
        allowedValues: rule.allowedValues?.length ? rule.allowedValues : null,
    }));

    const barcodeRule = rules.find((r) => r.canonical === 'barcode');
    if (barcodeRule) barcodeRule.required = true;
    else rules.unshift({ canonical: 'barcode', sources: ['barcode'], required: true, allowedValues: null });

    return rules;
};

const normaliseRow = (row, rules) => {
    const out = { ...row };
    for (const { canonical, sources } of rules) {
        if (canonical in out) continue;
        const src = sources.find((s) => Object.prototype.hasOwnProperty.call(row, s));
        if (src) out[canonical] = row[src];
    }
    return out;
};

const validateRow = (row, rules, displayRow, errors) => {
    for (const { canonical, required, allowedValues } of rules) {
        const raw = row[canonical];
        const value = typeof raw === 'string' ? raw.trim() : raw;
        const isEmpty = value === undefined || value === null || value === '';
        if (required && isEmpty) {
            errors.push(`Row ${displayRow}: ${canonical} is empty or missing`);
            continue;
        }
        if (!isEmpty && allowedValues && !allowedValues.includes(value)) {
            errors.push(`Row ${displayRow}: ${canonical}='${value}' is not in allowed values [${allowedValues.join(', ')}]`);
        }
    }
};

const validateRows = (rows, csvConfig) => {
    if (rows.length === 0) {
        return { isValid: false, errors: ['CSV is empty or contains only headers'] };
    }

    const rules = compileRules(csvConfig);
    const headers = new Set(Object.keys(rows[0]));
    const headerErrors = rules
        .filter((r) => r.required && !r.sources.some((s) => headers.has(s)))
        .map((r) => `Missing required column: ${r.canonical} (accepted headers: ${r.sources.join(', ')})`);
    if (headerErrors.length) return { isValid: false, errors: headerErrors };

    const errors = [];
    const seenBarcodes = new Map();
    const duplicateBarcodes = [];
    const normalisedRows = rows.map((row, index) => {
        const displayRow = index + 2;
        const normalised = normaliseRow(row, rules);
        validateRow(normalised, rules, displayRow, errors);

        const barcode = String(normalised.barcode ?? '').trim();
        if (barcode !== '') {
            if (seenBarcodes.has(barcode)) {
                duplicateBarcodes.push(barcode);
            } else {
                seenBarcodes.set(barcode, displayRow);
            }
        }

        return normalised;
    });

    return { isValid: errors.length === 0, errors, duplicateBarcodes, rows: normalisedRows };
};

module.exports = { parseCSV, validateRows };
