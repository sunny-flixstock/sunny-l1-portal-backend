const FrameworkDomainFinalOutputModel = require('../models/FrameworkDomainFinalOutput.model');
const FrameworkVersionModel = require('../models/FrameworkVersion.model');
const DescriptionGroupModel = require('../models/DescriptionGroup.model');
const ImageDescriptionModel = require('../models/ImageDescription.model');
const {
    IMAGE_DESCRIPTION_STATUSES,
    MAX_IMAGE_DESCRIPTION_RETRIES,
} = require('../models/ImageDescription.model');

const { pending, assigned, completed, rejected } = IMAGE_DESCRIPTION_STATUSES;

const DESCRIPTION_GROUP_MAX_FAILURE_RATIO = 0.1;

const isPermanentlyRejected = (row) =>
    row.status === rejected && row.retryCount >= MAX_IMAGE_DESCRIPTION_RETRIES;

const isDescriptionGroupReadyForAssignment = (imageDescriptionIds, rowByImageDescId) => {
    const ids = imageDescriptionIds ?? [];
    if (!ids.length) {
        return false;
    }

    let permanentFailureCount = 0;

    for (const id of ids) {
        const row = rowByImageDescId.get(String(id));
        if (!row) {
            return false;
        }

        if (row.status === completed) {
            continue;
        }

        if (isPermanentlyRejected(row)) {
            permanentFailureCount += 1;
            continue;
        }

        return false;
    }

    return permanentFailureCount / ids.length < DESCRIPTION_GROUP_MAX_FAILURE_RATIO;
};

const reconcileRetryableRejectedImageDescriptions = async () => {
    const result = await ImageDescriptionModel.updateMany(
        {
            status: rejected,
            retryCount: { $lt: MAX_IMAGE_DESCRIPTION_RETRIES },
        },
        {
            $set: { status: assigned, rejectionReason: '' },
            $inc: { retryCount: 1 },
        }
    );

    return result.modifiedCount ?? 0;
};

const reconcilePendingImageDescriptions = async (pendingGroups, statusByImageDescId) => {
    const imageDescIdsToAssign = new Set();

    for (const group of pendingGroups) {
        for (const id of group.imageDescriptionIds ?? []) {
            if (statusByImageDescId.get(String(id)) === pending) {
                imageDescIdsToAssign.add(String(id));
            }
        }
    }

    if (!imageDescIdsToAssign.size) {
        return 0;
    }

    const result = await ImageDescriptionModel.updateMany(
        {
            _id: { $in: [...imageDescIdsToAssign] },
            status: pending,
        },
        { $set: { status: assigned } }
    );

    return result.modifiedCount ?? 0;
};

const reconcilePendingDescriptionGroups = async () => {
    const imageDescriptionsRetried = await reconcileRetryableRejectedImageDescriptions();

    const pendingGroups = await DescriptionGroupModel.find({ status: pending })
        .select({ imageDescriptionIds: 1 })
        .lean();

    if (!pendingGroups.length) {
        return {
            imageDescriptionsRetried,
            imageDescriptionsAssigned: 0,
            groupsAssigned: 0,
        };
    }

    const imageDescIds = [
        ...new Set(
            pendingGroups.flatMap((group) =>
                (group.imageDescriptionIds ?? []).map((id) => String(id))
            )
        ),
    ];

    if (!imageDescIds.length) {
        return {
            imageDescriptionsRetried,
            imageDescriptionsAssigned: 0,
            groupsAssigned: 0,
        };
    }

    const imageDescriptions = await ImageDescriptionModel.find({ _id: { $in: imageDescIds } })
        .select({ status: 1, retryCount: 1 })
        .lean();

    const rowByImageDescId = new Map(
        imageDescriptions.map((row) => [String(row._id), row])
    );
    const statusByImageDescId = new Map(
        imageDescriptions.map((row) => [String(row._id), row.status])
    );

    const imageDescriptionsAssigned = await reconcilePendingImageDescriptions(
        pendingGroups,
        statusByImageDescId
    );

    const groupIdsToAssign = pendingGroups
        .filter((group) =>
            isDescriptionGroupReadyForAssignment(group.imageDescriptionIds, rowByImageDescId)
        )
        .map((group) => group._id);

    if (!groupIdsToAssign.length) {
        return {
            imageDescriptionsRetried,
            imageDescriptionsAssigned,
            groupsAssigned: 0,
        };
    }

    const groupResult = await DescriptionGroupModel.updateMany(
        {
            _id: { $in: groupIdsToAssign },
            status: pending,
        },
        { $set: { status: assigned } }
    );

    return {
        imageDescriptionsRetried,
        imageDescriptionsAssigned,
        groupsAssigned: groupResult.modifiedCount ?? 0,
    };
};

const reconcilePendingFrameworkDomainFinalOutputs = async () => {
    const pendingOutputs = await FrameworkDomainFinalOutputModel.find({ status: pending })
        .select({ descriptionGroupIds: 1 })
        .lean();

    if (!pendingOutputs.length) {
        return { outputsAssigned: 0 };
    }

    const groupIds = [
        ...new Set(
            pendingOutputs.flatMap((output) =>
                (output.descriptionGroupIds ?? []).map((id) => String(id))
            )
        ),
    ];

    if (!groupIds.length) {
        return { outputsAssigned: 0 };
    }

    const groups = await DescriptionGroupModel.find({ _id: { $in: groupIds } })
        .select({ status: 1 })
        .lean();

    const statusByGroupId = new Map(groups.map((row) => [String(row._id), row.status]));

    const outputIdsToAssign = pendingOutputs
        .filter((output) => {
            const ids = output.descriptionGroupIds ?? [];
            if (!ids.length) {
                return false;
            }

            return ids.every((id) => statusByGroupId.get(String(id)) === completed);
        })
        .map((output) => output._id);

    if (!outputIdsToAssign.length) {
        return { outputsAssigned: 0 };
    }

    const result = await FrameworkDomainFinalOutputModel.updateMany(
        {
            _id: { $in: outputIdsToAssign },
            status: pending,
        },
        { $set: { status: assigned } }
    );

    return { outputsAssigned: result.modifiedCount ?? 0 };
};

const buildKnowledgeFieldsFromOutputs = (outputs) => {
    const knowledgeFields = {};

    for (const output of outputs) {
        if (!output.description?.key) {
            return null;
        }

        knowledgeFields[output.domain] = {
            type: output.description.type ?? 's3',
            bucket: output.description.bucket,
            key: output.description.key,
            url: output.description.url ?? '',
        };
    }

    return knowledgeFields;
};

const areAllFrameworkDomainOutputsCompleted = (outputs) => {
    if (!outputs.length) {
        return false;
    }

    return outputs.every(
        (output) => output.status === completed && output.description?.key
    );
};

const reconcileInProgressFrameworkVersions = async () => {
    const inProgressVersions = await FrameworkVersionModel.find({ status: 'in_progress' })
        .select({ knowledgeFields: 1 })
        .lean();

    if (!inProgressVersions.length) {
        return { frameworkVersionsMovedToReview: 0 };
    }

    const versionIds = inProgressVersions.map((version) => version._id);
    const outputs = await FrameworkDomainFinalOutputModel.find({
        frameworkVersionId: { $in: versionIds },
    })
        .select({ frameworkVersionId: 1, domain: 1, status: 1, description: 1 })
        .lean();

    const outputsByVersionId = new Map();
    for (const output of outputs) {
        const versionKey = String(output.frameworkVersionId);
        if (!outputsByVersionId.has(versionKey)) {
            outputsByVersionId.set(versionKey, []);
        }
        outputsByVersionId.get(versionKey).push(output);
    }

    let frameworkVersionsMovedToReview = 0;

    for (const version of inProgressVersions) {
        const versionOutputs = outputsByVersionId.get(String(version._id)) ?? [];
        if (!areAllFrameworkDomainOutputsCompleted(versionOutputs)) {
            continue;
        }

        const knowledgeFields = buildKnowledgeFieldsFromOutputs(versionOutputs);
        if (!knowledgeFields) {
            continue;
        }

        const result = await FrameworkVersionModel.updateOne(
            { _id: version._id, status: 'in_progress' },
            {
                $set: {
                    status: 'in_review',
                    knowledgeFields: {
                        ...(version.knowledgeFields ?? {}),
                        ...knowledgeFields,
                    },
                },
            }
        );

        if (result.modifiedCount) {
            frameworkVersionsMovedToReview += 1;
        }
    }

    return { frameworkVersionsMovedToReview };
};

const reconcileFrameworkCreation = async () => {
    const outputResults = await reconcilePendingFrameworkDomainFinalOutputs();
    const groupResults = await reconcilePendingDescriptionGroups();
    const versionResults = await reconcileInProgressFrameworkVersions();

    return {
        ...groupResults,
        ...outputResults,
        ...versionResults,
    };
};

module.exports = {
    reconcileFrameworkCreation,
    reconcilePendingDescriptionGroups,
    reconcilePendingFrameworkDomainFinalOutputs,
    reconcileInProgressFrameworkVersions,
    isDescriptionGroupReadyForAssignment,
    isPermanentlyRejected,
    areAllFrameworkDomainOutputsCompleted,
    buildKnowledgeFieldsFromOutputs,
};
