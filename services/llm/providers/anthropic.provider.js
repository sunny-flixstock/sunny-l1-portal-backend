const axios = require('axios');
const BaseLlmProvider = require('../BaseLlmProvider');
const { ANTHROPIC_API_KEY } = require('../../../config');

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const REQUEST_TIMEOUT_MS = 120000;

class AnthropicLlmProvider extends BaseLlmProvider {
    constructor() {
        super('anthropic');
    }

    assertConfigured() {
        if (!ANTHROPIC_API_KEY) {
            throw new Error('ANTHROPIC_API_KEY is not set');
        }
    }

    buildUserContent(userContent, images) {
        const content = [];
        for (const img of this.normalizeImages(images)) {
            if (img.label) {
                content.push({ type: 'text', text: img.label });
            }
            content.push({
                type: 'image',
                source: { type: 'base64', media_type: img.mimeType, data: img.buffer.toString('base64') },
            });
        }

        if (userContent) {
            content.push({ type: 'text', text: userContent });
        }

        return content.length ? content : [{ type: 'text', text: '' }];
    }

    async generate({ model, systemPrompt, userContent, images, responseFormat = 'text', temperature }) {
        const body = {
            model,
            max_tokens: 8192,
            messages: [
                {
                    role: 'user',
                    content: this.buildUserContent(userContent, images),
                },
            ],
        };

        if (systemPrompt) {
            body.system = systemPrompt;
        }

        if (temperature != null) {
            body.temperature = temperature;
        }

        const { data } = await axios.post(ANTHROPIC_MESSAGES_URL, body, {
            headers: {
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': ANTHROPIC_VERSION,
                'Content-Type': 'application/json',
            },
            timeout: REQUEST_TIMEOUT_MS,
        });

        const text = (data?.content ?? [])
            .filter((block) => block.type === 'text')
            .map((block) => block.text)
            .join('\n');

        if (responseFormat === 'json') {
            return this.parseResponse(text, responseFormat);
        }

        return text;
    }
}

module.exports = AnthropicLlmProvider;
