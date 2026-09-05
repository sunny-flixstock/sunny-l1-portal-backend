const config = require('../config');
const {
    uploadFileBufferToS3,
    getFileFromS3,
    getS3Url,
} = require('../services/amazonS3Service');
const { getUrlFromKey } = require('../utils/CloudFront.s3');

const STORAGE_TYPES = Object.freeze(['s3']);

const promptStorageSchema = {
    type: {
        type: String,
        enum: STORAGE_TYPES,
        default: 's3',
    },
    bucket: { type: String, required: true, trim: true },
    key: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
};

// Same shape as promptStorageSchema, but bucket/key are optional until populated async.
const optionalPromptStorageSchema = {
    type: {
        type: String,
        enum: STORAGE_TYPES,
        default: 's3',
    },
    bucket: { type: String, trim: true },
    key: { type: String, trim: true },
    url: { type: String, trim: true },
};

const resolvePromptBucket = (bucket) =>
    bucket || config.PROMPT_S3_BUCKET || config.S3_BUCKET;

const buildPromptStorageKey = (instructionType, seriesKey, version) =>
    `prompts/${instructionType}/${seriesKey}/v${version}/prompt.md`;

const buildFrameworkDomainOutputKey = (frameworkVersionId, domain) =>
    `framework-outputs/${frameworkVersionId}/${domain}/final.md`;

const buildDescriptionGroupLlmPayloadKey = (descriptionGroupId) =>
    `description-groups/${descriptionGroupId}/llm-payloads/${Date.now()}.json`;

const buildFrameworkDomainFinalOutputLlmPayloadKey = (frameworkDomainFinalOutputId) =>
    `framework-domain-final-outputs/${frameworkDomainFinalOutputId}/llm-payloads/${Date.now()}.json`;

const buildBaseAngleDefinitionKey = (seriesKey, version) =>
    `base-angles/${seriesKey}/v${version}/definition.md`;

const buildClientAngleDefinitionKey = (seriesKey, version) =>
    `client-angles/${seriesKey}/v${version}/definition.md`;

const uploadPromptContent = async ({ content, instructionType, seriesKey, version, bucket }) => {
    if (!content || typeof content !== 'string') {
        throw new Error('uploadPromptContent requires non-empty string content');
    }

    const bucketName = resolvePromptBucket(bucket);
    const storageKey = buildPromptStorageKey(instructionType, seriesKey, version);

    await uploadFileBufferToS3(
        Buffer.from(content, 'utf8'),
        storageKey,
        bucketName,
        'text/markdown'
    );

    const { url } = getS3Url(bucketName, storageKey);

    return {
        type: 's3',
        bucket: bucketName,
        key: storageKey,
        url,
    };
};

const uploadFrameworkDomainOutput = async ({
    content,
    frameworkVersionId,
    domain,
    bucket,
}) => {
    if (!content || typeof content !== 'string') {
        throw new Error('uploadFrameworkDomainOutput requires non-empty string content');
    }
    if (!frameworkVersionId || !domain) {
        throw new Error('uploadFrameworkDomainOutput requires frameworkVersionId and domain');
    }

    const bucketName = resolvePromptBucket(bucket);
    const storageKey = buildFrameworkDomainOutputKey(frameworkVersionId, domain);

    await uploadFileBufferToS3(
        Buffer.from(content, 'utf8'),
        storageKey,
        bucketName,
        'text/markdown'
    );

    const { url } = getUrlFromKey(storageKey, undefined, bucketName);

    return {
        type: 's3',
        bucket: bucketName,
        key: storageKey,
        url,
    };
};

const uploadDescriptionGroupLlmPayload = async ({ descriptionGroupId, payload, bucket }) => {
    if (!descriptionGroupId) {
        throw new Error('uploadDescriptionGroupLlmPayload requires descriptionGroupId');
    }
    if (payload == null) {
        throw new Error('uploadDescriptionGroupLlmPayload requires payload');
    }

    const bucketName = resolvePromptBucket(bucket);
    const storageKey = buildDescriptionGroupLlmPayloadKey(descriptionGroupId);
    const content =
        typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);

    await uploadFileBufferToS3(
        Buffer.from(content, 'utf8'),
        storageKey,
        bucketName,
        'application/json'
    );

    const { url } = getS3Url(bucketName, storageKey);

    return {
        type: 's3',
        bucket: bucketName,
        key: storageKey,
        url,
    };
};

const uploadFrameworkDomainFinalOutputLlmPayload = async ({
    frameworkDomainFinalOutputId,
    payload,
    bucket,
}) => {
    if (!frameworkDomainFinalOutputId) {
        throw new Error(
            'uploadFrameworkDomainFinalOutputLlmPayload requires frameworkDomainFinalOutputId'
        );
    }
    if (payload == null) {
        throw new Error('uploadFrameworkDomainFinalOutputLlmPayload requires payload');
    }

    const bucketName = resolvePromptBucket(bucket);
    const storageKey = buildFrameworkDomainFinalOutputLlmPayloadKey(
        frameworkDomainFinalOutputId
    );
    const content =
        typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2);

    await uploadFileBufferToS3(
        Buffer.from(content, 'utf8'),
        storageKey,
        bucketName,
        'application/json'
    );

    const { url } = getS3Url(bucketName, storageKey);

    return {
        type: 's3',
        bucket: bucketName,
        key: storageKey,
        url,
    };
};

const readPromptContent = async (storage) => {
    if (!storage?.key || !storage?.bucket) {
        throw new Error('readPromptContent requires storage with bucket and key');
    }

    const s3Object = await getFileFromS3({
        key: storage.key,
        bucketName: storage.bucket,
    });

    return s3Object.Body.toString('utf8');
};

const uploadAngleDefinition = async ({ content, seriesKey, version, kind, bucket }) => {
    if (!content || typeof content !== 'string') {
        throw new Error('uploadAngleDefinition requires non-empty string content');
    }
    if (!seriesKey || !version) {
        throw new Error('uploadAngleDefinition requires seriesKey and version');
    }

    const bucketName = resolvePromptBucket(bucket);
    const storageKey =
        kind === 'client'
            ? buildClientAngleDefinitionKey(seriesKey, version)
            : buildBaseAngleDefinitionKey(seriesKey, version);

    await uploadFileBufferToS3(
        Buffer.from(content, 'utf8'),
        storageKey,
        bucketName,
        'text/markdown'
    );

    const { url } = getS3Url(bucketName, storageKey);

    return {
        type: 's3',
        bucket: bucketName,
        key: storageKey,
        url,
    };
};

module.exports = {
    STORAGE_TYPES,
    promptStorageSchema,
    optionalPromptStorageSchema,
    buildPromptStorageKey,
    buildFrameworkDomainOutputKey,
    buildDescriptionGroupLlmPayloadKey,
    buildFrameworkDomainFinalOutputLlmPayloadKey,
    buildBaseAngleDefinitionKey,
    buildClientAngleDefinitionKey,
    resolvePromptBucket,
    uploadPromptContent,
    uploadFrameworkDomainOutput,
    uploadDescriptionGroupLlmPayload,
    uploadFrameworkDomainFinalOutputLlmPayload,
    uploadAngleDefinition,
    readPromptContent,
};
