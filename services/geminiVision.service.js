const { generate } = require('./llm/llm.service');
const { GEMINI_VISION_MODEL } = require('../config');

const analyzeGarment = async ({ systemPrompt, images, text, model = GEMINI_VISION_MODEL }) =>
    generate({
        provider: 'google',
        model,
        systemPrompt,
        userContent: text,
        images,
        responseFormat: 'json',
    });

module.exports = { analyzeGarment };
