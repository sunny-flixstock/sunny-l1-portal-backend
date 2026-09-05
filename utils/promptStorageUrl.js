const { getUrlFromKey } = require('./CloudFront.s3');

const withCdnStorageUrl = (storage) => {
    if (!storage?.bucket || !storage?.key) {
        return storage ?? null;
    }

    try {
        const { url } = getUrlFromKey(storage.key, undefined, storage.bucket);
        return { ...storage, url };
    } catch {
        return storage;
    }
};

const withCdnKnowledgeFields = (knowledgeFields) => {
    if (!knowledgeFields || typeof knowledgeFields !== 'object') {
        return {};
    }

    return Object.fromEntries(
        Object.entries(knowledgeFields).map(([domain, storage]) => [
            domain,
            withCdnStorageUrl(storage),
        ])
    );
};

module.exports = {
    withCdnStorageUrl,
    withCdnKnowledgeFields,
};
