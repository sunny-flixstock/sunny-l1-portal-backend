
const DESCRIPTION_PROVIDER_OPTIONS = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Anthropic', value: 'anthropic' },
    { label: 'Google', value: 'google' },
    { label: 'Custom', value: 'custom' },
]

const EMBEDDING_PROVIDER_OPTIONS = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Google', value: 'google' },
    { label: 'Voyage AI', value: 'voyage' },
    { label: 'Custom', value: 'custom' },
]

const METADATA_TYPE_OPTIONS = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Array', value: 'array' },
    { label: 'Object', value: 'object' },
]

const ARRAY_ITEM_OPTIONS = [
    { label: 'String', value: 'string' },
    { label: 'Number', value: 'number' },
    { label: 'Boolean', value: 'boolean' },
    { label: 'Object', value: 'object' },
]

const SIMILARITY_METRIC_OPTIONS = [
    { label: 'Cosine similarity', value: 'cosine' },
    { label: 'Dot product', value: 'dot' },
    { label: 'Euclidean distance', value: 'euclidean' },
]

const DESCRIPTION_MODEL_CATALOG = {
    openai: [
        {
            value: 'gpt-5.5',
            note: 'OpenAI flagship model for complex reasoning and high-quality generation.',
        },
        {
            value: 'gpt-5.5-pro',
            note: 'Premium OpenAI variant for maximum quality and precision.',
        },
        {
            value: 'gpt-5.4',
            note: 'Strong general-purpose model for coding and professional workloads.',
        },
        {
            value: 'gpt-5.4-mini',
            note: 'Faster and lower-cost OpenAI model suited for production text generation.',
        },
        {
            value: 'gpt-5.4-nano',
            note: 'Lowest-latency OpenAI option for lightweight text generation.',
        },
    ],
    anthropic: [
        {
            value: 'claude-opus-4-7',
            note: 'Anthropic’s most capable Claude model for complex reasoning and long-form work.',
        },
        {
            value: 'claude-sonnet-4-6',
            note: 'Balanced Anthropic model with strong quality, speed, and cost efficiency.',
        },
        {
            value: 'claude-haiku-4-5',
            note: 'Fastest current Claude model for lower-latency generation tasks.',
        },
    ],
    google: [
        {
            value: 'gemini-3.5-flash-lite',
            note: 'Lightweight Gemini 3.5 model optimized for fast, cost-efficient generation.',
        },
        {
            value: 'gemini-3.1-pro-preview',
            note: 'Google’s advanced reasoning and coding model for the most complex tasks.',
        },
        {
            value: 'gemini-3-flash-preview',
            note: 'Frontier-class Google model optimized for strong performance at lower cost.',
        },
        {
            value: 'gemini-3.1-flash-lite',
            note: 'Stable low-cost Google model for fast production generation.',
        },
        {
            value: 'gemini-3.1-flash-lite-preview',
            note: 'Preview Flash-Lite variant with newer improvements.',
        },
        {
            value: 'gemini-2.5-pro',
            note: 'Google’s advanced 2.5 generation model for deep reasoning and coding.',
        },
        {
            value: 'gemini-2.5-flash',
            note: 'Strong price-performance model for low-latency generation.',
        },
        {
            value: 'gemini-2.5-flash-lite',
            note: 'Fast and budget-friendly Gemini 2.5 model.',
        },
        {
            value: 'gemini-2.0-flash-001',
            note: 'Older Google workhorse model that remains useful for simpler generation tasks.',
        },
    ],
}

const EMBEDDING_MODEL_CATALOG = {
    google: [
        {
            value: 'gemini-embedding-001',
            defaultDimension: 3072,
            adjustable: true,
            minDimension: 1,
            maxDimension: 3072,
            note: 'Flagship Google text embedding model with multilingual and code support.',
        },
        {
            value: 'gemini-embedding-2-preview',
            defaultDimension: 3072,
            adjustable: true,
            minDimension: 128,
            maxDimension: 3072,
            note: 'Multimodal embeddings for text, image, audio, video, and PDF in one vector space.',
        },
        {
            value: 'gemini-embedding-2',
            defaultDimension: 3072,
            adjustable: true,
            minDimension: 128,
            maxDimension: 3072,
            note: 'Multimodal embeddings for text, image, audio, video, and PDF in one vector space.',
        },
        {
            value: 'text-embedding-005',
            defaultDimension: 768,
            adjustable: false,
            note: 'Optimized for English and code retrieval workloads.',
        },
        {
            value: 'text-multilingual-embedding-002',
            defaultDimension: 768,
            adjustable: false,
            note: 'Multilingual semantic retrieval model.',
        },
        {
            value: 'text-embedding-004',
            defaultDimension: 768,
            adjustable: false,
            note: 'Earlier general-purpose Google text embedding model.',
        },
        {
            value: 'multimodalembedding@001',
            defaultDimension: 1408,
            adjustable: false,
            note: 'Legacy Vertex multimodal embedding model.',
        },
        {
            value: 'textembedding-gecko@003',
            defaultDimension: 768,
            adjustable: false,
            note: 'Legacy Gecko text embedding model.',
        },
        {
            value: 'textembedding-gecko-multilingual@001',
            defaultDimension: 768,
            adjustable: false,
            note: 'Legacy multilingual Gecko embedding model.',
        },
        {
            value: 'textembedding-gecko@002',
            defaultDimension: 768,
            adjustable: false,
            note: 'Deprecated Gecko generation.',
        },
        {
            value: 'textembedding-gecko@001',
            defaultDimension: 768,
            adjustable: false,
            note: 'First Gecko embedding generation.',
        },
    ],
    voyage: [
        {
            value: 'voyage-large-2',
            defaultDimension: 1536,
            adjustable: false,
            note: 'High-quality general retrieval model.',
        },
        {
            value: 'voyage-3-large',
            defaultDimension: 1024,
            adjustable: false,
            note: 'Newer flagship retrieval model.',
        },
        {
            value: 'voyage-3',
            defaultDimension: 1024,
            adjustable: false,
            note: 'Balanced latency and quality for general retrieval.',
        },
        {
            value: 'voyage-code-3',
            defaultDimension: 1024,
            adjustable: false,
            note: 'Code embedding model.',
        },
        {
            value: 'voyage-law-2',
            defaultDimension: 1024,
            adjustable: false,
            note: 'Legal-domain tuned retrieval model.',
        },
        {
            value: 'voyage-finance-2',
            defaultDimension: 1024,
            adjustable: false,
            note: 'Finance-domain tuned retrieval model.',
        },
        {
            value: 'voyage-multilingual-2',
            defaultDimension: 1024,
            adjustable: false,
            note: 'Multilingual retrieval model.',
        },
    ],
    openai: [
        {
            value: 'text-embedding-3-small',
            defaultDimension: 1536,
            adjustable: true,
            minDimension: 1,
            maxDimension: 1536,
            note: 'Cheapest and fastest OpenAI general-purpose embedding model.',
        },
        {
            value: 'text-embedding-3-large',
            defaultDimension: 3072,
            adjustable: true,
            minDimension: 1,
            maxDimension: 3072,
            note: 'Highest quality OpenAI embedding model.',
        },
        {
            value: 'text-embedding-ada-002',
            defaultDimension: 1536,
            adjustable: false,
            note: 'Older OpenAI embedding model that is still supported.',
        },
    ],
}


module.exports = {
    DESCRIPTION_PROVIDER_OPTIONS,
    EMBEDDING_PROVIDER_OPTIONS,
    METADATA_TYPE_OPTIONS,
    ARRAY_ITEM_OPTIONS,
    SIMILARITY_METRIC_OPTIONS,
    DESCRIPTION_MODEL_CATALOG,
    EMBEDDING_MODEL_CATALOG,
}