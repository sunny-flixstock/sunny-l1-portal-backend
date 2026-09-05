const axios = require('axios');
const BaseLlmProvider = require('../BaseLlmProvider');
const { CUSTOM_LLM_BASE_URL, CUSTOM_LLM_API_KEY } = require('../../../config');

const REQUEST_TIMEOUT_MS = 120000;

class CustomLlmProvider extends BaseLlmProvider {
    constructor() {
        super('custom');
    }

    assertConfigured() {
        if (!CUSTOM_LLM_BASE_URL) {
            throw new Error('CUSTOM_LLM_BASE_URL is not set');
        }
    }

    async generate({ model, systemPrompt, userContent, images, responseFormat = 'text' }) {
        const payload = {
            provider: this.providerId,
            model,
            systemPrompt,
            userContent,
            images: this.normalizeImages(images).map((img) => ({
                mimeType: img.mimeType,
                data: img.buffer.toString('base64'),
            })),
            responseFormat,
        };

        const { data } = await axios.post(CUSTOM_LLM_BASE_URL, payload, {
            headers: {
                ...(CUSTOM_LLM_API_KEY ? { Authorization: `Bearer ${CUSTOM_LLM_API_KEY}` } : {}),
                'Content-Type': 'application/json',
            },
            timeout: REQUEST_TIMEOUT_MS,
        });

        if (data?.content !== undefined) {
            if (responseFormat === 'json' && typeof data.content === 'string') {
                return this.parseResponse(data.content, responseFormat);
            }
            return data.content;
        }

        const text = data?.text ?? data?.result ?? '';
        return this.parseResponse(text, responseFormat);
    }
}

module.exports = CustomLlmProvider;
