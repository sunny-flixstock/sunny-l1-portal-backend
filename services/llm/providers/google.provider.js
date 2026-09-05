const { GoogleGenerativeAI } = require('@google/generative-ai');
const BaseLlmProvider = require('../BaseLlmProvider');
const { GEMINI_API_KEY } = require('../../../config');

let client = null;

class GoogleLlmProvider extends BaseLlmProvider {
    constructor() {
        super('google');
    }

    getClient() {
        if (!client) {
            this.assertConfigured();
            client = new GoogleGenerativeAI(GEMINI_API_KEY);
        }
        return client;
    }

    assertConfigured() {
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set');
        }
    }

    async generate({ model, systemPrompt, userContent, images, responseFormat = 'text', temperature }) {
        const genModel = this.getClient().getGenerativeModel({
            model,
            ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
        });

        const parts = [];
        for (const img of this.normalizeImages(images)) {
            if (img.label) {
                parts.push({ text: img.label });
            }
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.buffer.toString('base64') } });
        }
        if (userContent) {
            parts.push({ text: userContent });
        }

        const generationConfig = {
            // Without an explicit ceiling, a response that must echo back a
            // full trace object (RCA's declared output format) can get cut
            // off mid-JSON-string on a larger SKU -- surfacing as a
            // confusing "Unterminated string" JSON.parse error rather than
            // an honest truncation signal. gemini-2.5-flash supports up to
            // 65536 output tokens; asking for the max heads this off.
            maxOutputTokens: 65536,
        };
        if (responseFormat === 'json') {
            generationConfig.responseMimeType = 'application/json';
        }
        if (temperature != null) {
            generationConfig.temperature = temperature;
        }

        const result = await genModel.generateContent({
            contents: [{ role: 'user', parts }],
            ...(Object.keys(generationConfig).length ? { generationConfig } : {}),
        });

        const finishReason = result.response.candidates?.[0]?.finishReason;
        if (finishReason === 'MAX_TOKENS') {
            throw new Error(
                `Gemini response was truncated (finishReason=MAX_TOKENS) even at maxOutputTokens=${generationConfig.maxOutputTokens} -- the input is producing a response too large for this model; consider trimming input or splitting the request.`
            );
        }

        return this.parseResponse(result.response.text(), responseFormat);
    }
}

module.exports = GoogleLlmProvider;
