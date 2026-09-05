const axios = require('axios');
const BaseLlmProvider = require('../BaseLlmProvider');
const { OPENAI_API_KEY } = require('../../../config');

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 120000;

class OpenAiLlmProvider extends BaseLlmProvider {
    constructor() {
        super('openai');
    }

    assertConfigured() {
        if (!OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set');
        }
    }

    buildUserContent(userContent, images) {
        const normalizedImages = this.normalizeImages(images);
        if (!normalizedImages.length) {
            return userContent ?? '';
        }

        const content = normalizedImages.map((img) => ({
            type: 'image_url',
            image_url: {
                url: `data:${img.mimeType};base64,${img.buffer.toString('base64')}`,
            },
        }));

        if (userContent) {
            content.push({ type: 'text', text: userContent });
        }

        return content;
    }

    async generate({ model, systemPrompt, userContent, images, responseFormat = 'text', temperature }) {
        const userMessageContent = this.buildUserContent(userContent, images);
        const body = {
            model,
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: userMessageContent },
            ],
        };

        if (responseFormat === 'json') {
            body.response_format = { type: 'json_object' };
        }

        if (temperature != null) {
            body.temperature = temperature;
        }

        const { data } = await axios.post(OPENAI_CHAT_URL, body, {
            headers: {
                Authorization: `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: REQUEST_TIMEOUT_MS,
        });

        const text = data?.choices?.[0]?.message?.content ?? '';
        return this.parseResponse(text, responseFormat);
    }
}

module.exports = OpenAiLlmProvider;
