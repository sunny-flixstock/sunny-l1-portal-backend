const FrameworkDomainFinalOutputModel = require('../models/FrameworkDomainFinalOutput.model');
const DescriptionGroupModel = require('../models/DescriptionGroup.model');
const ImageDescriptionModel = require('../models/ImageDescription.model');
const { IMAGE_DESCRIPTION_STATUSES } = require('../models/ImageDescription.model');
const { collectInputSetImageIds } = require('./imageDescription.service');

const collectRelevantDescriptionGroupIds = async ({
    domain,
    instructionId,
    provider,
    model,
    domainCacheKey,
    frameworkVocabId,
    categoryRegistryId,
    candidateIdSet,
    session,
}) => {
    let groupQuery = DescriptionGroupModel.find({
        domain,
        provider,
        model,
        frameworkCreationInstruction: instructionId,
        domainCacheKey,
        frameworkVocabId,
        categoryRegistryId,
    }).select({ imageDescriptionIds: 1 });
    if (session) {
        groupQuery = groupQuery.session(session);
    }
    const groups = await groupQuery.lean();

    return groups
        .filter((group) => {
            const ids = group.imageDescriptionIds ?? [];
            return ids.length > 0 && ids.every((id) => candidateIdSet.has(String(id)));
        })
        .map((group) => group._id);
};

const ensureFrameworkDomainFinalOutputsForFramework = async ({
    frameworkVersionId,
    frameworkCreationInstructions,
    inputSet,
    domainCacheKeys,
    imageDescriptionCacheKey,
    frameworkVocabId,
    categoryRegistryId,
    session,
}) => {
    const imageIds = collectInputSetImageIds(inputSet);
    if (!imageIds.length || !frameworkCreationInstructions?.length) {
        return { created: 0, skipped: 0, totalDomains: 0 };
    }

    const options = session ? { session } : {};
    let created = 0;
    let skipped = 0;

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

        const candidateIdSet = new Set(candidates.map((row) => String(row._id)));
        if (!candidateIdSet.size) {
            continue;
        }

        const descriptionGroupIds = await collectRelevantDescriptionGroupIds({
            domain,
            instructionId,
            provider,
            model,
            domainCacheKey,
            frameworkVocabId,
            categoryRegistryId,
            candidateIdSet,
            session,
        });

        if (!descriptionGroupIds.length) {
            continue;
        }

        const result = await FrameworkDomainFinalOutputModel.updateOne(
            { frameworkVersionId, domain },
            {
                $setOnInsert: {
                    frameworkVersionId,
                    domain,
                    descriptionGroupIds,
                    status: IMAGE_DESCRIPTION_STATUSES.pending,
                    rejectionReason: '',
                },
            },
            { upsert: true, ...options }
        );

        if (result.upsertedCount) {
            created += 1;
        } else {
            skipped += 1;
        }
    }

    return {
        created,
        skipped,
        totalDomains: frameworkCreationInstructions.length,
    };
};

module.exports = {
    collectRelevantDescriptionGroupIds,
    ensureFrameworkDomainFinalOutputsForFramework,
};
