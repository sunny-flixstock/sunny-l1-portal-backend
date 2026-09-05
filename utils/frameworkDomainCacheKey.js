const { GetMD5Hash } = require('./crypto');

const normalizeRuleHash = (ruleHash) => {
    if (!ruleHash) {
        return {};
    }
    if (ruleHash instanceof Map) {
        return Object.fromEntries(ruleHash);
    }
    return ruleHash;
};

const buildDomainCacheKeyMaterial = (domain, ruleHash, frameworkVocabContentHash, categoryRegistryContentHash) => {
    const rules = normalizeRuleHash(ruleHash);
    const rulePart = rules[domain] ?? '';
    return `${rulePart}|${frameworkVocabContentHash}|${categoryRegistryContentHash}`;
};

const buildDomainCacheKeys = async ({
    domains,
    ruleHash,
    frameworkVocabContentHash,
    categoryRegistryContentHash,
}) => {
    const keys = {};
    for (const domain of domains) {
        keys[domain] = await GetMD5Hash(
            buildDomainCacheKeyMaterial(
                domain,
                ruleHash,
                frameworkVocabContentHash,
                categoryRegistryContentHash
            )
        );
    }
    return keys;
};

const buildImageDescriptionCacheKeyMaterial = (
    frameworkVocabContentHash,
    categoryRegistryContentHash
) => `${frameworkVocabContentHash}|${categoryRegistryContentHash}`;

const buildImageDescriptionCacheKey = async (
    frameworkVocabContentHash,
    categoryRegistryContentHash
) =>
    GetMD5Hash(
        buildImageDescriptionCacheKeyMaterial(
            frameworkVocabContentHash,
            categoryRegistryContentHash
        )
    );

module.exports = {
    buildDomainCacheKeyMaterial,
    buildDomainCacheKeys,
    buildImageDescriptionCacheKeyMaterial,
    buildImageDescriptionCacheKey,
};
