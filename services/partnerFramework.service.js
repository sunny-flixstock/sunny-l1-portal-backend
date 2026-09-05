const FrameworkGroupModel = require('../models/FrameworkGroup.model');
const FrameworkVersionModel = require('../models/FrameworkVersion.model');
const FrameworkVocabModel = require('../models/FrameworkVocab.model');
const CategoryRegistryModel = require('../models/CategoryRegistry.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { withCdnKnowledgeFields } = require('../utils/promptStorageUrl');

const getFrameworkForPartner = async ({ client, gender, season, category }) => {
    const clientCode = client?.trim();
    if (!clientCode) {
        throw new Api400Error('client is required');
    }

    const exists = await ClientModel.exists({ code: clientCode });
    if (!exists) {
        throw new Api400Error(`Client not found: ${clientCode}`);
    }

    const group = await FrameworkGroupModel.resolveGroup({
        client: clientCode,
        gender,
        season,
        category,
    });

    if (!group) {
        throw new Api400Error(
            `No framework group found for client "${clientCode}" with the given constraints`
        );
    }

    if (!group.activeProductionFrameworkVersionId) {
        throw new Api400Error(
            `No active production framework version for framework group: ${group._id}`
        );
    }

    const version = await FrameworkVersionModel.findById(group.activeProductionFrameworkVersionId)
        .select({
            frameworkGroupId: 1,
            client: 1,
            version: 1,
            name: 1,
            status: 1,
            domains: 1,
            knowledgeFields: 1,
            frameworkVocabId: 1,
            categoryRegistryId: 1,
        })
        .lean();

    if (!version) {
        throw new Api400Error(
            `Active production framework version not found: ${group.activeProductionFrameworkVersionId}`
        );
    }

    const [frameworkVocab, categoryRegistry] = await Promise.all([
        FrameworkVocabModel.findById(version.frameworkVocabId).lean(),
        CategoryRegistryModel.findById(version.categoryRegistryId).lean(),
    ]);

    if (!frameworkVocab) {
        throw new Api400Error(`Framework vocab not found: ${version.frameworkVocabId}`);
    }
    if (!categoryRegistry) {
        throw new Api400Error(`Category registry not found: ${version.categoryRegistryId}`);
    }

    return {
        data: {
            frameworkGroup: {
                _id: group._id,
                client: group.client,
                gender: group.gender,
                season: group.season,
                category: group.category,
                name: group.name,
            },
            frameworkVersion: {
                _id: version._id,
                frameworkGroupId: version.frameworkGroupId,
                client: version.client,
                version: version.version,
                name: version.name,
                status: version.status,
                domains: version.domains ?? [],
            },
            knowledgeFields: withCdnKnowledgeFields(version.knowledgeFields),
            frameworkVocab,
            categoryRegistry,
        },
    };
};

module.exports = {
    getFrameworkForPartner,
};
