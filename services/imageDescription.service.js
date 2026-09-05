const ImageDescriptionModel = require('../models/ImageDescription.model');
const { IMAGE_DESCRIPTION_STATUSES } = require('../models/ImageDescription.model');

const instructionGroupKey = (entry) =>
    `${String(entry.instructionId)}|${entry.provider}|${entry.model}`;

const groupDescriptionGenerationInstructions = (instructions) => {
    const groups = new Map();

    for (const entry of instructions ?? []) {
        const key = instructionGroupKey(entry);

        if (!groups.has(key)) {
            groups.set(key, {
                descriptionInstruction: entry.instructionId,
                provider: entry.provider,
                model: entry.model,
                domains: [],
            });
        }

        const group = groups.get(key);
        if (!group.domains.includes(entry.domain)) {
            group.domains.push(entry.domain);
        }
    }

    return [...groups.values()];
};

const collectInputSetImageIds = (inputSet) => {
    const ids = new Set([
        ...(inputSet.goodExampleImageIds ?? []).map((id) => String(id)),
        ...(inputSet.badExampleImageIds ?? []).map((id) => String(id)),
    ]);

    return [...ids];
};

const buildImageDescriptionDocuments = ({
    imageIds,
    instructionGroups,
    domainCacheKey,
    frameworkVocabId,
    categoryRegistryId,
}) => {
    const docs = [];

    for (const imageId of imageIds) {
        for (const group of instructionGroups) {
            docs.push({
                imageId,
                descriptionInstruction: group.descriptionInstruction,
                domains: [...group.domains],
                provider: group.provider,
                model: group.model,
                domainCacheKey,
                frameworkVocabId,
                categoryRegistryId,
                description: '',
                status: IMAGE_DESCRIPTION_STATUSES.pending,
                rejectionReason: '',
                retryCount: 0,
            });
        }
    }

    return docs;
};

const ensureImageDescriptionsForFramework = async ({
    descriptionGenerationInstructions,
    inputSet,
    domainCacheKey,
    frameworkVocabId,
    categoryRegistryId,
    session,
}) => {
    const instructionGroups = groupDescriptionGenerationInstructions(
        descriptionGenerationInstructions
    );
    const imageIds = collectInputSetImageIds(inputSet);

    if (!imageIds.length) {
        return { created: 0, skipped: 0, totalCombinations: 0 };
    }

    if (!instructionGroups.length) {
        return { created: 0, skipped: 0, totalCombinations: 0 };
    }

    if (!domainCacheKey) {
        return { created: 0, skipped: 0, totalCombinations: 0 };
    }

    const documents = buildImageDescriptionDocuments({
        imageIds,
        instructionGroups,
        domainCacheKey,
        frameworkVocabId,
        categoryRegistryId,
    });

    const bulkOps = documents.map((doc) => ({
        updateOne: {
            filter: {
                imageId: doc.imageId,
                descriptionInstruction: doc.descriptionInstruction,
                provider: doc.provider,
                model: doc.model,
                domainCacheKey: doc.domainCacheKey,
            },
            update: { $setOnInsert: doc },
            upsert: true,
        },
    }));

    const options = { ordered: false };
    if (session) {
        options.session = session;
    }

    const result = await ImageDescriptionModel.bulkWrite(bulkOps, options);
    const created = result.upsertedCount ?? 0;
    const totalCombinations = documents.length;

    return {
        created,
        skipped: totalCombinations - created,
        totalCombinations,
    };
};

module.exports = {
    groupDescriptionGenerationInstructions,
    collectInputSetImageIds,
    buildImageDescriptionDocuments,
    ensureImageDescriptionsForFramework,
};
