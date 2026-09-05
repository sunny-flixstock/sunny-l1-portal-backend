const Api400Error = require('../../errors/api400Error');
const { DESCRIPTION_PROVIDER_OPTIONS } = require('../../model.catalog');

const ALLOWED_PROVIDERS = new Set(DESCRIPTION_PROVIDER_OPTIONS.map((option) => option.value));

const providerFactories = {
    openai: () => new (require('./providers/openai.provider'))(),
    anthropic: () => new (require('./providers/anthropic.provider'))(),
    google: () => new (require('./providers/google.provider'))(),
    custom: () => new (require('./providers/custom.provider'))(),
};

const providerCache = new Map();

const resolveProvider = (providerId) => {
    const normalized = String(providerId ?? '').trim().toLowerCase();
    if (!normalized) {
        throw new Api400Error('Provider is required');
    }
    if (!ALLOWED_PROVIDERS.has(normalized)) {
        throw new Api400Error(`Unsupported provider: ${normalized}`);
    }

    if (!providerCache.has(normalized)) {
        const factory = providerFactories[normalized];
        if (!factory) {
            throw new Api400Error(`Provider not implemented: ${normalized}`);
        }
        providerCache.set(normalized, factory());
    }

    return providerCache.get(normalized);
};

const generate = async ({
    provider,
    model,
    systemPrompt,
    userContent,
    text,
    images,
    responseFormat = 'text',
    temperature,
}) => {
    const instance = resolveProvider(provider);
    instance.assertConfigured();

    const normalizedModel = String(model ?? '').trim();
    if (!normalizedModel) {
        throw new Api400Error('Model is required');
    }

    return instance.generate({
        model: normalizedModel,
        systemPrompt,
        userContent: userContent ?? text,
        images,
        responseFormat,
        temperature,
    });
};

module.exports = {
    resolveProvider,
    generate,
};
