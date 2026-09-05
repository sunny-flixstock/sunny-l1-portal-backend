const { EMBEDDING_PROVIDER } = require('../../config');

const providers = {
    gemini: () => require('./providers/gemini.provider'),
};

const getProvider = () => {
    const factory = providers[EMBEDDING_PROVIDER];
    if (!factory) throw new Error(`Unknown embedding provider: ${EMBEDDING_PROVIDER}`);
    return factory();
};

const generateEmbedding = (text, opts) => getProvider().embed(text, opts);

const isMeaningful = (v) => {
    if (v === undefined || v === null) return false;
    const s = typeof v === 'string' ? v.trim().toLowerCase() : v;
    return s !== '' && s !== '-' && s !== 'n/a' && s !== 'unknown';
};

const flattenObject = (obj, out = []) => {
    for (const [k, v] of Object.entries(obj)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            flattenObject(v, out);
        } else if (Array.isArray(v)) {
            if (v.length && v.every(isMeaningful)) out.push(`${k}: ${v.join(', ')}`);
        } else if (isMeaningful(v)) {
            out.push(`${k}: ${v}`);
        }
    }
    return out;
};

const buildEmbedText = (sku) => {
    const lines = [];

    // Sku image description is the description of the SKU
    if (sku.skuImageDescription) {
        try {
            const parsedDescription = JSON.parse(sku.skuImageDescription);
            const filteredDescription = {
                title: parsedDescription?.title,
                attributes: parsedDescription?.attributes,
                search_keywords: parsedDescription?.search_keywords,
            };
            flattenObject(filteredDescription, lines);
        } catch (_) {
            lines.push(sku.skuImageDescription);
        }
    }

    // Pattern dict is the metadata of the SKU
    if (sku.patternDict && typeof sku.patternDict === 'object') {
        flattenObject(sku.patternDict, lines);
    }

    if (sku.garmentCategorization?.category) {
        lines.push(`category: ${sku.garmentCategorization.category}`);
    }

    return lines.join('\n');
};

const flattenAny = (value, lines) => {
    if (Array.isArray(value)) {
        for (const item of value) flattenAny(item, lines);
    } else if (value && typeof value === 'object') {
        flattenObject(value, lines);
    } else if (isMeaningful(value)) {
        lines.push(String(value));
    }
};

const buildPartnerEmbedText = (sku) => {
    const raw = sku?.skuImageDescription;
    if (!raw || typeof raw !== 'string') return '';

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (_) {
        return raw.trim();
    }

    const lines = [];
    flattenAny(parsed, lines);
    return lines.join('\n');
};

module.exports = { generateEmbedding, buildEmbedText, buildPartnerEmbedText };
