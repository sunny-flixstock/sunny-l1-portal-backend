class BaseLlmProvider {
    constructor(providerId) {
        if (new.target === BaseLlmProvider) {
            throw new Error('BaseLlmProvider cannot be instantiated directly');
        }
        this.providerId = providerId;
    }

    getProviderId() {
        return this.providerId;
    }

    assertConfigured() {
        throw new Error(`assertConfigured() not implemented for provider: ${this.providerId}`);
    }

    async generate() {
        throw new Error(`generate() not implemented for provider: ${this.providerId}`);
    }

    normalizeImages(images = []) {
        return images
            .filter((img) => img?.buffer)
            .map((img) => ({
                buffer: Buffer.isBuffer(img.buffer) ? img.buffer : Buffer.from(img.buffer),
                mimeType: img.mimeType || 'image/jpeg',
                // Optional text placed immediately before this image in the
                // model's input, so a call sending several images (e.g. one
                // per flagged variant in a SKU) can tell the model which
                // image is which. Providers that ignore it just show the
                // image with no preceding label -- fully backward compatible.
                label: img.label,
            }));
    }

    parseResponse(text, responseFormat) {
        const normalized = String(text ?? '').trim();
        if (responseFormat === 'json') {
            return JSON.parse(normalized);
        }
        return normalized;
    }
}

module.exports = BaseLlmProvider;
