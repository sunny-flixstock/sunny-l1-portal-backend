const DescriptionGroupModel = require('../models/DescriptionGroup.model');
const ImageDescriptionModel = require('../models/ImageDescription.model');
const { IMAGE_DESCRIPTION_STATUSES } = require('../models/ImageDescription.model');
const { DESCRIPTION_GROUP_BATCH_SIZE } = require('../config');
const { collectInputSetImageIds } = require('./imageDescription.service');

const buildDescriptionGroupKey = ({
    domain,
    provider,
    model,
    frameworkCreationInstruction,
}) =>
    `${domain}|${provider}|${model}|${String(frameworkCreationInstruction)}`;

const chunkArray = (items, size) => {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
};

const ensureDescriptionGroupsForFramework = async ({
    frameworkCreationInstructions,
    inputSet,
    domainCacheKeys,
    imageDescriptionCacheKey,
    ruleIdsByDomain,
    frameworkVocabId,
    categoryRegistryId,
    session,
}) => {
    const imageIds = collectInputSetImageIds(inputSet);
    if (!imageIds.length || !frameworkCreationInstructions?.length) {
        return { created: 0, skipped: 0, totalCandidates: 0, batchesCreated: 0 };
    }

    const options = session ? { session } : {};
    let created = 0;
    let skipped = 0;
    let totalCandidates = 0;

    for (const entry of frameworkCreationInstructions) {
        const { domain, instructionId, provider, model } = entry;
        const domainCacheKey = domainCacheKeys?.[domain];
        if (!domainCacheKey) {
            continue;
        }

        let candidateQuery = ImageDescriptionModel.find({
            imageId: { $in: imageIds },
            domains: domain,
            domainCacheKey: imageDescriptionCacheKey,
            frameworkVocabId,
            categoryRegistryId,
        }).select({ _id: 1 });
        if (session) {
            candidateQuery = candidateQuery.session(session);
        }
        const candidates = await candidateQuery.lean();

        const candidateIds = candidates.map((row) => String(row._id));
        totalCandidates += candidateIds.length;

        if (!candidateIds.length) {
            continue;
        }

        let existingGroupQuery = DescriptionGroupModel.find({
            domain,
            provider,
            model,
            frameworkCreationInstruction: instructionId,
            domainCacheKey,
            frameworkVocabId,
            categoryRegistryId,
        }).select({ imageDescriptionIds: 1 });
        if (session) {
            existingGroupQuery = existingGroupQuery.session(session);
        }
        const existingGroups = await existingGroupQuery.lean();

        const remainingCandidateIds = new Set(candidateIds);

        for (const group of existingGroups) {
            const groupIds = (group.imageDescriptionIds ?? []).map((id) => String(id));
            if (!groupIds.length) {
                continue;
            }

            const qualifiesForReuse = groupIds.every((id) => remainingCandidateIds.has(id));
            if (!qualifiesForReuse) {
                continue;
            }

            for (const id of groupIds) {
                remainingCandidateIds.delete(id);
            }
            skipped += groupIds.length;
        }

        const uncoveredIds = [...remainingCandidateIds];

        if (!uncoveredIds.length) {
            continue;
        }

        const chunks = chunkArray(uncoveredIds, DESCRIPTION_GROUP_BATCH_SIZE);
        const documents = chunks.map((chunk) => ({
            imageDescriptionIds: chunk,
            domain,
            frameworkCreationInstruction: instructionId,
            provider,
            model,
            domainCacheKey,
            ruleIds: ruleIdsByDomain?.[domain] ?? [],
            frameworkVocabId,
            categoryRegistryId,
            status: IMAGE_DESCRIPTION_STATUSES.pending,
            description: '',
            rejectionReason: '',
        }));

        await DescriptionGroupModel.insertMany(documents, options);
        created += documents.length;
    }

    return {
        created,
        skipped,
        totalCandidates,
        batchesCreated: created,
    };
};

module.exports = {
    buildDescriptionGroupKey,
    ensureDescriptionGroupsForFramework,
};
