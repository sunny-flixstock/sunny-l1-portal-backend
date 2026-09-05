const { GoogleGenerativeAI, TaskType } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../../../config');

let model = null;

const getModel = () => {
    if (!model) {
        if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
    }
    return model;
};

const resolveTaskType = (kind) => {
    if (kind === 'query') return TaskType.RETRIEVAL_QUERY;
    return TaskType.RETRIEVAL_DOCUMENT;
};

const embed = async (text, { kind = 'document', title = '' } = {}) => {
    const taskType = resolveTaskType(kind);
    const request = {
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: 2000,
    };
    if (taskType === TaskType.RETRIEVAL_DOCUMENT && title) request.title = title;

    const result = await getModel().embedContent(request);
    return result.embedding.values;
};

module.exports = { embed };
