const mongoose = require('mongoose');
const FrameworkVersionModel = require('../models/FrameworkVersion.model');
const { FRAMEWORK_VERSION_STATUSES } = require('../models/FrameworkVersion.model');
const FrameworkDomainFinalOutputModel = require('../models/FrameworkDomainFinalOutput.model');
const FrameworkGroupModel = require('../models/FrameworkGroup.model');
const SystemInstructionModel = require('../models/SystemInstruction.model');
const InputSetModel = require('../models/InputSet.model');
const FrameworkVocabModel = require('../models/FrameworkVocab.model');
const CategoryRegistryModel = require('../models/CategoryRegistry.model');
const RuleModel = require('../models/Rule.model');
const ClientModel = require('../models/Client.model');
const Api400Error = require('../errors/api400Error');
const { markInputSetActiveIfDraft } = require('./inputSet.service');
const { getSkipAndLimitForPagination } = require('../utils/pagination');
const { escapeRegex } = require('../utils/regex');
const { parseEnumListParam } = require('../utils/parseEnumListParam');
const { assertModelSelection } = require('../utils/modelSelection');
const { WrapInTransaction } = require('../startup/db');
const { ensureImageDescriptionsForFramework } = require('./imageDescription.service');
const { ensureDescriptionGroupsForFramework } = require('./descriptionGroup.service');
const { ensureFrameworkDomainFinalOutputsForFramework } = require('./frameworkDomainFinalOutput.service');
const {
    buildDomainCacheKeys,
    buildImageDescriptionCacheKey,
} = require('../utils/frameworkDomainCacheKey');
const { DOMAINS } = require('../utils/domains');
const {
    readPromptContent,
    uploadFrameworkDomainOutput,
} = require('../models/PromptRegistry.model');

const INSTRUCTION_TYPES = Object.freeze({
    description: 'image_description',
    framework: 'framework_builder',
});

const normalizeDomain = (value) => value.trim().toLowerCase();

const buildRuleIdsByDomain = async (clientRulesIds, domains) => {
    const ruleIdsByDomain = Object.fromEntries((domains ?? []).map((domain) => [domain, []]));
    const ids = clientRulesIds ?? [];
    if (!ids.length) {
        return ruleIdsByDomain;
    }

    const rules = await RuleModel.find({ _id: { $in: ids } })
        .select({ _id: 1, ruleType: 1 })
        .lean();

    for (const rule of rules) {
        if (ruleIdsByDomain[rule.ruleType]) {
            ruleIdsByDomain[rule.ruleType].push(rule._id);
        }
    }

    return ruleIdsByDomain;
};

const assertValidObjectId = (id, label) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Api400Error(`Invalid ${label}`);
    }
};

const assertClientExists = async (client) => {
    const exists = await ClientModel.exists({ code: client });
    if (!exists) {
        throw new Api400Error(`Client not found: ${client}`);
    }
};

const assertFrameworkGroup = async (frameworkGroupId, client) => {
    assertValidObjectId(frameworkGroupId, 'framework group id');
    const group = await FrameworkGroupModel.findById(frameworkGroupId).lean();
    if (!group) {
        throw new Api400Error(`Framework group not found: ${frameworkGroupId}`);
    }
    if (group.client !== client) {
        throw new Api400Error('Framework group does not belong to the selected client');
    }
    return group;
};

const assertSystemInstruction = async (instructionId, expectedType, label) => {
    assertValidObjectId(instructionId, label);
    const instruction = await SystemInstructionModel.findById(instructionId)
        .select({ instructionType: 1, status: 1, name: 1 })
        .lean();
    if (!instruction) {
        throw new Api400Error(`System instruction not found: ${instructionId}`);
    }
    if (instruction.status !== 'active') {
        throw new Api400Error(`System instruction must be active: ${instructionId}`);
    }
    if (instruction.instructionType !== expectedType) {
        throw new Api400Error(
            `${label} must be an active ${expectedType.replace(/_/g, ' ')} instruction`
        );
    }
    return instruction;
};

const assertDomains = (domains) => {
    if (!Array.isArray(domains) || domains.length === 0) {
        throw new Api400Error('At least one domain is required');
    }

    const normalized = domains.map((value) => normalizeDomain(String(value)));
    if (normalized.some((value) => !value)) {
        throw new Api400Error('Domain names cannot be empty');
    }

    const unique = new Set(normalized);
    if (unique.size !== normalized.length) {
        throw new Api400Error('Domain names must be unique');
    }

    return normalized;
};

const assertDomainInstructions = async ({
    entries,
    domains,
    expectedType,
    label,
}) => {
    if (!Array.isArray(entries) || entries.length === 0) {
        throw new Api400Error(`${label} must include at least one entry`);
    }

    const expectedSet = new Set(domains);
    const seen = new Set();
    const normalized = [];

    for (const entry of entries) {
        const domain = normalizeDomain(String(entry?.domain ?? ''));
        if (!domain) {
            throw new Api400Error(`${label} entries require a domain`);
        }
        if (seen.has(domain)) {
            throw new Api400Error(`Duplicate ${label.toLowerCase()} entry for domain: ${domain}`);
        }
        if (!expectedSet.has(domain)) {
            throw new Api400Error(`${label} includes unknown domain: ${domain}`);
        }

        seen.add(domain);
        await assertSystemInstruction(entry.instructionId, expectedType, `${label} (${domain})`);
        const modelSelection = assertModelSelection(
            entry.provider,
            entry.model,
            `${label} (${domain})`
        );
        normalized.push({
            domain,
            instructionId: entry.instructionId,
            provider: modelSelection.provider,
            model: modelSelection.model,
        });
    }

    for (const domain of domains) {
        if (!seen.has(domain)) {
            throw new Api400Error(`${label} is missing an entry for domain: ${domain}`);
        }
    }

    return normalized;
};

const assertFrameworkVocab = async (frameworkVocabId) => {
    assertValidObjectId(frameworkVocabId, 'framework vocab id');
    const vocab = await FrameworkVocabModel.findById(frameworkVocabId)
        .select({ name: 1, contentHash: 1 })
        .lean();
    if (!vocab) {
        throw new Api400Error(`Framework vocab not found: ${frameworkVocabId}`);
    }
    return vocab;
};

const assertCategoryRegistry = async (categoryRegistryId) => {
    assertValidObjectId(categoryRegistryId, 'category registry id');
    const registry = await CategoryRegistryModel.findById(categoryRegistryId)
        .select({ name: 1, contentHash: 1 })
        .lean();
    if (!registry) {
        throw new Api400Error(`Category registry not found: ${categoryRegistryId}`);
    }
    return registry;
};

const assertInputSet = async (inputSetId, client) => {
    assertValidObjectId(inputSetId, 'input set id');
    const inputSet = await InputSetModel.findById(inputSetId)
        .select({ client: 1, name: 1, status: 1 })
        .lean();
    if (!inputSet) {
        throw new Api400Error(`Input set not found: ${inputSetId}`);
    }
    if (inputSet.client !== client) {
        throw new Api400Error('Input set does not belong to the selected client');
    }
    if (inputSet.status === 'archive') {
        throw new Api400Error('Archived input sets cannot be used in a framework version');
    }
    return inputSet;
};

const allocateNextVersion = async (frameworkGroupId) => {
    const group = await FrameworkGroupModel.findOneAndUpdate(
        { _id: frameworkGroupId },
        { $inc: { versionSequence: 1 } },
        { new: true }
    )
        .select({ versionSequence: 1 })
        .lean();

    if (!group) {
        throw new Api400Error(`Framework group not found: ${frameworkGroupId}`);
    }

    return String(group.versionSequence);
};

const collectInstructionIds = (rows) =>
    [
        ...new Set(
            rows.flatMap((row) => [
                ...(row.descriptionGenerationInstructions ?? []).map((entry) => entry.instructionId),
                ...(row.frameworkCreationInstructions ?? []).map((entry) => entry.instructionId),
            ])
        ),
    ].filter(Boolean);

const enrichFrameworkVersions = async (rows) => {
    if (!rows.length) {
        return [];
    }

    const groupIds = [...new Set(rows.map((row) => String(row.frameworkGroupId)))];
    const inputSetIds = [
        ...new Set(rows.filter((row) => row.inputSet).map((row) => String(row.inputSet))),
    ];
    const frameworkVocabIds = [
        ...new Set(
            rows.filter((row) => row.frameworkVocabId).map((row) => String(row.frameworkVocabId))
        ),
    ];
    const categoryRegistryIds = [
        ...new Set(
            rows
                .filter((row) => row.categoryRegistryId)
                .map((row) => String(row.categoryRegistryId))
        ),
    ];
    const instructionIds = collectInstructionIds(rows);

    const [groups, inputSets, frameworkVocabs, categoryRegistries, instructions] = await Promise.all([
        FrameworkGroupModel.find({ _id: { $in: groupIds } })
            .select({
                name: 1,
                client: 1,
                gender: 1,
                season: 1,
                category: 1,
                activeProductionFrameworkVersionId: 1,
            })
            .lean(),
        inputSetIds.length
            ? InputSetModel.find({ _id: { $in: inputSetIds } })
                  .select({ name: 1 })
                  .lean()
            : [],
        frameworkVocabIds.length
            ? FrameworkVocabModel.find({ _id: { $in: frameworkVocabIds } })
                  .select({ name: 1, contentHash: 1 })
                  .lean()
            : [],
        categoryRegistryIds.length
            ? CategoryRegistryModel.find({ _id: { $in: categoryRegistryIds } })
                  .select({ name: 1, contentHash: 1 })
                  .lean()
            : [],
        instructionIds.length
            ? SystemInstructionModel.find({ _id: { $in: instructionIds } })
                  .select({ name: 1, instructionType: 1, version: 1 })
                  .lean()
            : [],
    ]);

    const groupById = new Map(groups.map((group) => [String(group._id), group]));
    const inputSetById = new Map(inputSets.map((set) => [String(set._id), set]));
    const frameworkVocabById = new Map(frameworkVocabs.map((row) => [String(row._id), row]));
    const categoryRegistryById = new Map(categoryRegistries.map((row) => [String(row._id), row]));
    const instructionById = new Map(instructions.map((row) => [String(row._id), row]));

    return rows.map((row) => ({
        ...row,
        frameworkGroup: groupById.get(String(row.frameworkGroupId)) ?? null,
        inputSetSummary: row.inputSet ? inputSetById.get(String(row.inputSet)) ?? null : null,
        frameworkVocabSummary: row.frameworkVocabId
            ? frameworkVocabById.get(String(row.frameworkVocabId)) ?? null
            : null,
        categoryRegistrySummary: row.categoryRegistryId
            ? categoryRegistryById.get(String(row.categoryRegistryId)) ?? null
            : null,
        descriptionGenerationInstructions: (row.descriptionGenerationInstructions ?? []).map(
            (entry) => ({
                ...entry,
                instruction: instructionById.get(String(entry.instructionId)) ?? null,
            })
        ),
        frameworkCreationInstructions: (row.frameworkCreationInstructions ?? []).map((entry) => ({
            ...entry,
            instruction: instructionById.get(String(entry.instructionId)) ?? null,
        })),
    }));
};

const listFrameworkVersions = async ({
    client,
    frameworkGroupId,
    status,
    q,
    pageNum,
    pageSize,
}) => {
    const filter = {};

    if (client) {
        filter.client = client.trim();
    }

    if (frameworkGroupId) {
        assertValidObjectId(frameworkGroupId, 'framework group id');
        filter.frameworkGroupId = frameworkGroupId;
    }

    const statusValues = parseEnumListParam(status);
    if (statusValues.length) {
        const invalid = statusValues.filter((value) => !FRAMEWORK_VERSION_STATUSES.includes(value));
        if (invalid.length) {
            throw new Api400Error(`Invalid status: ${invalid.join(', ')}`);
        }
        filter.status = { $in: statusValues };
    }

    if (q) {
        const pattern = escapeRegex(q);
        filter.$or = [
            { name: { $regex: pattern, $options: 'i' } },
            { version: { $regex: pattern, $options: 'i' } },
            { client: { $regex: pattern, $options: 'i' } },
        ];
    }

    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });
    const resolvedPageNum = parseInt(pageNum, 10) || 1;

    const [data, total] = await Promise.all([
        FrameworkVersionModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        FrameworkVersionModel.countDocuments(filter),
    ]);

    const enriched = await enrichFrameworkVersions(data);

    return {
        data: enriched,
        pagination: {
            total,
            pageNum: resolvedPageNum,
            pageSize: limit,
            totalPages: Math.ceil(total / limit) || 0,
        },
    };
};

const getFrameworkVersionById = async (id) => {
    assertValidObjectId(id, 'framework version id');

    const version = await FrameworkVersionModel.findById(id).lean();
    if (!version) {
        throw new Api400Error(`Framework version not found: ${id}`);
    }

    const [enriched] = await enrichFrameworkVersions([version]);
    return enriched;
};

const createFrameworkVersion = async (body) => {
    const client = body.client.trim();
    const name = body.name.trim();
    const frameworkGroupId = body.frameworkGroupId;

    await assertClientExists(client);
    await assertFrameworkGroup(frameworkGroupId, client);

    const domains = assertDomains(body.domains);
    const descriptionGenerationInstructions = await assertDomainInstructions({
        entries: body.descriptionGenerationInstructions,
        domains,
        expectedType: INSTRUCTION_TYPES.description,
        label: 'Description generation instruction',
    });
    const frameworkCreationInstructions = await assertDomainInstructions({
        entries: body.frameworkCreationInstructions,
        domains,
        expectedType: INSTRUCTION_TYPES.framework,
        label: 'Framework creation instruction',
    });
    await assertInputSet(body.inputSet, client);
    await assertFrameworkVocab(body.frameworkVocabId);
    await assertCategoryRegistry(body.categoryRegistryId);

    const version = await allocateNextVersion(frameworkGroupId);

    try {
        const created = await FrameworkVersionModel.create({
            frameworkGroupId,
            client,
            name,
            version,
            status: 'draft',
            domains,
            descriptionGenerationInstructions,
            frameworkCreationInstructions,
            inputSet: body.inputSet,
            frameworkVocabId: body.frameworkVocabId,
            categoryRegistryId: body.categoryRegistryId,
        });

        await markInputSetActiveIfDraft(body.inputSet);

        const [enriched] = await enrichFrameworkVersions([
            created.toObject ? created.toObject() : created,
        ]);
        return enriched;
    } catch (err) {
        if (err?.code === 11000) {
            throw new Api400Error(
                `Framework version ${version} already exists for this framework group`
            );
        }
        throw err;
    }
};

const startFrameworkCreation = async (id) => {
    assertValidObjectId(id, 'framework version id');

    const version = await FrameworkVersionModel.findById(id).lean();
    if (!version) {
        throw new Api400Error(`Framework version not found: ${id}`);
    }

    if (version.status !== 'draft') {
        throw new Api400Error(
            `Framework version must be in draft status to start creation (current: ${version.status})`
        );
    }

    if (!version.inputSet) {
        throw new Api400Error('Framework version must have an input set before starting creation');
    }

    const descriptionGenerationInstructions = version.descriptionGenerationInstructions ?? [];
    if (!descriptionGenerationInstructions.length) {
        throw new Api400Error(
            'Framework version must have description generation instructions before starting creation'
        );
    }

    const frameworkCreationInstructions = version.frameworkCreationInstructions ?? [];
    if (!frameworkCreationInstructions.length) {
        throw new Api400Error(
            'Framework version must have framework creation instructions before starting creation'
        );
    }

    const [inputSet, frameworkVocab, categoryRegistry] = await Promise.all([
        InputSetModel.findById(version.inputSet)
            .select({ goodExampleImageIds: 1, badExampleImageIds: 1, ruleHash: 1, clientRulesIds: 1 })
            .lean(),
        FrameworkVocabModel.findById(version.frameworkVocabId)
            .select({ contentHash: 1 })
            .lean(),
        CategoryRegistryModel.findById(version.categoryRegistryId)
            .select({ contentHash: 1 })
            .lean(),
    ]);
    if (!inputSet) {
        throw new Api400Error(`Input set not found: ${version.inputSet}`);
    }
    if (!frameworkVocab) {
        throw new Api400Error(`Framework vocab not found: ${version.frameworkVocabId}`);
    }
    if (!categoryRegistry) {
        throw new Api400Error(`Category registry not found: ${version.categoryRegistryId}`);
    }

    const domains = version.domains ?? [];
    const domainCacheKeys = await buildDomainCacheKeys({
        domains,
        ruleHash: inputSet.ruleHash,
        frameworkVocabContentHash: frameworkVocab.contentHash,
        categoryRegistryContentHash: categoryRegistry.contentHash,
    });
    const imageDescriptionCacheKey = await buildImageDescriptionCacheKey(
        frameworkVocab.contentHash,
        categoryRegistry.contentHash
    );
    const ruleIdsByDomain = await buildRuleIdsByDomain(inputSet.clientRulesIds, domains);

    const imageIds = [
        ...(inputSet.goodExampleImageIds ?? []),
        ...(inputSet.badExampleImageIds ?? []),
    ];
    if (!imageIds.length) {
        throw new Api400Error('Input set must include at least one example image');
    }

    const { imageDescriptionStats, descriptionGroupStats, frameworkDomainFinalOutputStats } =
        await WrapInTransaction(async (session) => {
            const updated = await FrameworkVersionModel.findOneAndUpdate(
                { _id: id, status: 'draft' },
                { $set: { status: 'in_progress' } },
                { new: true, session }
            ).lean();

            if (!updated) {
                throw new Api400Error(
                    'Framework version is no longer in draft status and cannot start creation'
                );
            }

            const imageStats = await ensureImageDescriptionsForFramework({
                descriptionGenerationInstructions,
                inputSet,
                domainCacheKey: imageDescriptionCacheKey,
                frameworkVocabId: version.frameworkVocabId,
                categoryRegistryId: version.categoryRegistryId,
                session,
            });

            const groupStats = await ensureDescriptionGroupsForFramework({
                frameworkCreationInstructions,
                inputSet,
                domainCacheKeys,
                imageDescriptionCacheKey,
                ruleIdsByDomain,
                frameworkVocabId: version.frameworkVocabId,
                categoryRegistryId: version.categoryRegistryId,
                session,
            });

            const finalOutputStats = await ensureFrameworkDomainFinalOutputsForFramework({
                frameworkVersionId: id,
                frameworkCreationInstructions,
                inputSet,
                domainCacheKeys,
                imageDescriptionCacheKey,
                frameworkVocabId: version.frameworkVocabId,
                categoryRegistryId: version.categoryRegistryId,
                session,
            });

            return {
                imageDescriptionStats: imageStats,
                descriptionGroupStats: groupStats,
                frameworkDomainFinalOutputStats: finalOutputStats,
            };
        });

    const enriched = await getFrameworkVersionById(id);
    return {
        data: enriched,
        domainCacheKeys,
        imageDescriptionCacheKey,
        imageDescriptions: imageDescriptionStats,
        descriptionGroups: descriptionGroupStats,
        frameworkDomainFinalOutputs: frameworkDomainFinalOutputStats,
    };
};

const getFrameworkVersionDomainDescriptions = async (id) => {
    assertValidObjectId(id, 'framework version id');

    const version = await FrameworkVersionModel.findById(id)
        .select({ status: 1, domains: 1, knowledgeFields: 1, name: 1, version: 1 })
        .lean();

    if (!version) {
        throw new Api400Error(`Framework version not found: ${id}`);
    }

    const knowledgeFields = version.knowledgeFields ?? {};
    const domainOrder = [
        ...(version.domains ?? []),
        ...Object.keys(knowledgeFields).filter((domain) => !version.domains?.includes(domain)),
    ];

    const descriptions = [];

    for (const domain of domainOrder) {
        const storage = knowledgeFields[domain];
        if (!storage?.bucket || !storage?.key) {
            continue;
        }

        const content = await readPromptContent(storage);
        descriptions.push({
            domain,
            storage,
            content,
        });
    }

    return {
        frameworkVersionId: version._id,
        name: version.name,
        version: version.version,
        descriptions,
    };
};

const updateFrameworkVersionDomainDescription = async (id, domain, contentMarkdown) => {
    assertValidObjectId(id, 'framework version id');

    const normalizedDomain = normalizeDomain(String(domain ?? ''));
    if (!normalizedDomain) {
        throw new Api400Error('domain is required');
    }
    if (!DOMAINS.includes(normalizedDomain)) {
        throw new Api400Error(`Invalid domain: ${normalizedDomain}`);
    }

    const trimmedMarkdown = contentMarkdown?.trim();
    if (!trimmedMarkdown) {
        throw new Api400Error('contentMarkdown is required');
    }

    const version = await FrameworkVersionModel.findById(id)
        .select({ status: 1, knowledgeFields: 1, domains: 1 })
        .lean();

    if (!version) {
        throw new Api400Error(`Framework version not found: ${id}`);
    }

    const existingStorage = version.knowledgeFields?.[normalizedDomain];
    if (!existingStorage?.bucket || !existingStorage?.key) {
        throw new Api400Error(`No generated description found for domain: ${normalizedDomain}`);
    }

    const descriptionStorage = await uploadFrameworkDomainOutput({
        content: trimmedMarkdown,
        frameworkVersionId: id,
        domain: normalizedDomain,
    });

    const knowledgeFieldUpdate = {
        [`knowledgeFields.${normalizedDomain}`]: descriptionStorage,
    };

    const updated = await FrameworkVersionModel.findOneAndUpdate(
        { _id: id },
        { $set: knowledgeFieldUpdate },
        { new: true }
    )
        .select({ status: 1, domains: 1, knowledgeFields: 1, name: 1, version: 1 })
        .lean();

    if (!updated) {
        throw new Api400Error(`Framework version not found: ${id}`);
    }

    await FrameworkDomainFinalOutputModel.updateOne(
        { frameworkVersionId: id, domain: normalizedDomain },
        { $set: { description: descriptionStorage } }
    );

    return {
        domain: normalizedDomain,
        storage: descriptionStorage,
        content: trimmedMarkdown,
    };
};

const archiveFrameworkVersion = async (id) => {
    assertValidObjectId(id, 'framework version id');

    const archived = await FrameworkVersionModel.findOneAndUpdate(
        { _id: id, status: 'in_review' },
        { $set: { status: 'archived' } },
        { new: true }
    ).lean();

    if (!archived) {
        const exists = await FrameworkVersionModel.exists({ _id: id });
        if (!exists) {
            throw new Api400Error(`Framework version not found: ${id}`);
        }
        throw new Api400Error(
            'Only framework versions in review can be archived'
        );
    }

    const [enriched] = await enrichFrameworkVersions([archived]);
    return enriched;
};

const makeFrameworkVersionLive = async (id) => {
    assertValidObjectId(id, 'framework version id');

    const result = await WrapInTransaction(async (session) => {
        const version = await FrameworkVersionModel.findById(id)
            .select({ status: 1, frameworkGroupId: 1 })
            .session(session)
            .lean();

        if (!version) {
            throw new Api400Error(`Framework version not found: ${id}`);
        }

        if (version.status !== 'in_review') {
            throw new Api400Error(
                'Only framework versions in review can be made live'
            );
        }

        const group = await FrameworkGroupModel.findById(version.frameworkGroupId)
            .session(session)
            .lean();

        if (!group) {
            throw new Api400Error(
                `Framework group not found: ${version.frameworkGroupId}`
            );
        }

        await FrameworkVersionModel.updateMany(
            {
                frameworkGroupId: version.frameworkGroupId,
                _id: { $ne: id },
                status: 'promoted',
            },
            {
                $set: { status: 'in_review' },
                $unset: { promotedAt: 1, promotedBy: 1 },
            },
            { session }
        );

        const promoted = await FrameworkVersionModel.findOneAndUpdate(
            { _id: id, status: 'in_review' },
            { $set: { status: 'promoted', promotedAt: new Date() } },
            { new: true, session }
        ).lean();

        if (!promoted) {
            throw new Api400Error(
                'Framework version is no longer in review and cannot be made live'
            );
        }

        const updatedGroup = await FrameworkGroupModel.findByIdAndUpdate(
            version.frameworkGroupId,
            { $set: { activeProductionFrameworkVersionId: id } },
            { new: true, session }
        ).lean();

        return { promoted, updatedGroup };
    });

    const [enriched] = await enrichFrameworkVersions([result.promoted]);
    return {
        data: enriched,
        frameworkGroup: result.updatedGroup,
    };
};

const demoteToInReview = async (id) => {
    assertValidObjectId(id, 'framework version id');

    const result = await WrapInTransaction(async (session) => {
        const version = await FrameworkVersionModel.findById(id)
            .select({ status: 1, frameworkGroupId: 1 })
            .session(session)
            .lean();

        if (!version) {
            throw new Api400Error(`Framework version not found: ${id}`);
        }

        if (version.status !== 'promoted') {
            throw new Api400Error(
                'Only promoted framework versions can be demoted'
            );
        }

        const group = await FrameworkGroupModel.findById(version.frameworkGroupId)
            .session(session)
            .lean();

        if (!group) {
            throw new Api400Error(
                `Framework group not found: ${version.frameworkGroupId}`
            );
        }

        const demoted = await FrameworkVersionModel.findOneAndUpdate(
            { _id: id, status: 'promoted' },
            {
                $set: { status: 'in_review' },
                $unset: { promotedAt: 1, promotedBy: 1 },
            },
            { new: true, session }
        ).lean();

        if (!demoted) {
            throw new Api400Error(
                'Framework version is no longer promoted and cannot be demoted'
            );
        }

        const updatedGroup = await FrameworkGroupModel.findByIdAndUpdate(
            version.frameworkGroupId,
            { $set: { activeProductionFrameworkVersionId: null } },
            { new: true, session }
        ).lean();

        return { demoted, updatedGroup };
    });

    const [enriched] = await enrichFrameworkVersions([result.demoted]);
    return {
        data: enriched,
        frameworkGroup: result.updatedGroup,
    };
};

module.exports = {
    listFrameworkVersions,
    getFrameworkVersionById,
    createFrameworkVersion,
    startFrameworkCreation,
    getFrameworkVersionDomainDescriptions,
    updateFrameworkVersionDomainDescription,
    archiveFrameworkVersion,
    makeFrameworkVersionLive,
    demoteToInReview,
};
