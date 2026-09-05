const Api400Error = require('../errors/api400Error');
const {
    DESCRIPTION_PROVIDER_OPTIONS,
    DESCRIPTION_MODEL_CATALOG,
} = require('../model.catalog');

const ALLOWED_PROVIDERS = new Set(DESCRIPTION_PROVIDER_OPTIONS.map((option) => option.value));
const CATALOG_PROVIDERS = new Set(Object.keys(DESCRIPTION_MODEL_CATALOG));

const assertModelSelection = (provider, model, label) => {
    const normalizedProvider = String(provider ?? '').trim();
    const normalizedModel = String(model ?? '').trim();

    if (!normalizedProvider) {
        throw new Api400Error(`${label} requires a model provider`);
    }
    if (!ALLOWED_PROVIDERS.has(normalizedProvider)) {
        throw new Api400Error(`${label} has invalid provider: ${normalizedProvider}`);
    }
    if (!normalizedModel) {
        throw new Api400Error(`${label} requires a model`);
    }

    if (normalizedProvider === 'custom') {
        return {
            provider: normalizedProvider,
            model: normalizedModel,
        };
    }

    if (!CATALOG_PROVIDERS.has(normalizedProvider)) {
        throw new Api400Error(`${label} has unsupported provider: ${normalizedProvider}`);
    }

    const allowedModels = DESCRIPTION_MODEL_CATALOG[normalizedProvider].map((entry) => entry.value);
    if (!allowedModels.includes(normalizedModel)) {
        throw new Api400Error(`${label} has invalid model for ${normalizedProvider}: ${normalizedModel}`);
    }

    return {
        provider: normalizedProvider,
        model: normalizedModel,
    };
};

module.exports = {
    assertModelSelection,
    DESCRIPTION_PROVIDER_VALUES: [...ALLOWED_PROVIDERS],
};
