const FrameworkDomainFinalOutputModel = require('../models/FrameworkDomainFinalOutput.model');
const FrameworkVersionModel = require('../models/FrameworkVersion.model');
const DescriptionGroupModel = require('../models/DescriptionGroup.model');
const RuleModel = require('../models/Rule.model');
const { IMAGE_DESCRIPTION_STATUSES } = require('../models/ImageDescription.model');
const { getSystemInstructionById } = require('./systemInstruction.service');
const { getFrameworkVocabById } = require('./frameworkVocab.service');
const { getCategoryRegistryById } = require('./categoryRegistry.service');
const { generate } = require('./llm/llm.service');
const {
    uploadFrameworkDomainOutput,
    uploadFrameworkDomainFinalOutputLlmPayload,
} = require('../models/PromptRegistry.model');

const { assigned, inProgress, completed, rejected } = IMAGE_DESCRIPTION_STATUSES;

const PARTIAL_LIBRARY_DELIMITER = '===PARTIAL===';
const DEFAULT_MAX_ITEMS_PER_RUN = 100;

const pickAssignedFrameworkDomainFinalOutput = async () =>
    FrameworkDomainFinalOutputModel.findOneAndUpdate(
        { status: assigned },
        { $set: { status: inProgress, rejectionReason: '' } },
        { sort: { updatedAt: 1 }, new: true }
    ).lean();

const resolveDomainCreationInstruction = (frameworkVersion, domain) => {
    const entry = (frameworkVersion?.frameworkCreationInstructions ?? []).find(
        (instruction) => instruction.domain === domain
    );

    if (!entry) {
        throw new Error(
            `Framework creation instruction not found for domain: ${domain}`
        );
    }

    return entry;
};

const fetchOrderedCompletedDescriptionGroups = async (descriptionGroupIds) => {
    const groups = await DescriptionGroupModel.find({
        _id: { $in: descriptionGroupIds ?? [] },
        status: completed,
    })
        .select({ description: 1, ruleIds: 1 })
        .lean();

    const groupById = new Map(groups.map((group) => [String(group._id), group]));

    return (descriptionGroupIds ?? [])
        .map((id) => groupById.get(String(id)))
        .filter(Boolean);
};

const buildPartialLibrariesText = (descriptionGroups) => {
    const documents = descriptionGroups
        .map((group) => String(group.description ?? '').trim())
        .filter(Boolean);

    if (!documents.length) {
        return '';
    }

    return documents.join(`\n${PARTIAL_LIBRARY_DELIMITER}\n`);
};

const collectRuleIds = (descriptionGroups) => [
    ...new Set(
        descriptionGroups.flatMap((group) =>
            (group.ruleIds ?? []).map((id) => String(id))
        )
    ),
];

const buildFrameworkRulesText = (rules) =>
    rules
        .map((rule) => `[${rule.priority}] [${rule.polarity}] ${rule.ruleText}`)
        .join('\n');

const fetchFrameworkRules = async (ruleIds) => {
    if (!ruleIds.length) {
        return '';
    }

    const rules = await RuleModel.find({ _id: { $in: ruleIds } })
        .select({ polarity: 1, priority: 1, ruleText: 1 })
        .lean();

    return buildFrameworkRulesText(rules);
};

const buildFrameworkDomainFinalOutputUserPrompt = ({
    partialLibraries,
    frameworkVocab,
    categoryRegistry,
    domain,
    frameworkRules,
}) => ({
    mode: 'merge',
    partial_libraries: partialLibraries,
    framework_vocab: frameworkVocab?.vocab ?? null,
    category_registry: categoryRegistry?.registry ?? null,
    domain,
    framework_rules: frameworkRules,
});

const buildFrameworkDomainFinalOutputUserContent = (userPrompt) =>
    JSON.stringify(userPrompt, null, 2);

const buildFrameworkDomainFinalOutputLlmPayload = ({
    provider,
    model,
    systemPrompt,
    userPrompt,
}) => ({
    provider,
    model,
    systemPrompt,
    userContent: userPrompt,
    responseFormat: 'text',
});

const saveFrameworkDomainFinalOutputLlmPayload = async (
    frameworkDomainFinalOutputId,
    payload
) => {
    const storage = await uploadFrameworkDomainFinalOutputLlmPayload({
        frameworkDomainFinalOutputId,
        payload,
    });

    await FrameworkDomainFinalOutputModel.updateOne(
        { _id: frameworkDomainFinalOutputId, status: inProgress },
        { $set: { llmPayloadStorage: storage } }
    );

    return storage;
};

const markFrameworkDomainFinalOutputRejected = async (id, rejectionReason) => {
    await FrameworkDomainFinalOutputModel.updateOne(
        { _id: id, status: inProgress },
        {
            $set: {
                status: rejected,
                rejectionReason: String(rejectionReason ?? '').slice(0, 2000),
            },
        }
    );
};

const markFrameworkDomainFinalOutputCompleted = async (id, descriptionStorage) => {
    await FrameworkDomainFinalOutputModel.updateOne(
        { _id: id, status: inProgress },
        {
            $set: {
                description: descriptionStorage,
                status: completed,
                rejectionReason: '',
            },
        }
    );
};

const processFrameworkDomainFinalOutputJob = async (job) => {
    const tag = `[frameworkDomainFinalOutput ${job._id}]`;

    const frameworkVersion = await FrameworkVersionModel.findById(job.frameworkVersionId)
        .select({
            frameworkCreationInstructions: 1,
            frameworkVocabId: 1,
            categoryRegistryId: 1,
        })
        .lean();

    if (!frameworkVersion) {
        throw new Error(`Framework version not found: ${job.frameworkVersionId}`);
    }

    const domainInstruction = resolveDomainCreationInstruction(frameworkVersion, job.domain);
    const descriptionGroups = await fetchOrderedCompletedDescriptionGroups(
        job.descriptionGroupIds
    );

    if (!descriptionGroups.length) {
        throw new Error('No completed description groups available for this domain output');
    }

    const partialLibraries = buildPartialLibrariesText(descriptionGroups);
    if (!partialLibraries) {
        throw new Error('No partial library content available from completed description groups');
    }

    const ruleIds = collectRuleIds(descriptionGroups);

    const [instruction, frameworkVocab, categoryRegistry, frameworkRules] = await Promise.all([
        getSystemInstructionById(domainInstruction.instructionId, {
            includeContent: true,
        }),
        getFrameworkVocabById(frameworkVersion.frameworkVocabId),
        getCategoryRegistryById(frameworkVersion.categoryRegistryId),
        fetchFrameworkRules(ruleIds),
    ]);

    if (!instruction.systemPrompt?.trim()) {
        throw new Error(
            `System instruction has no content: ${domainInstruction.instructionId}`
        );
    }

    const userPrompt = buildFrameworkDomainFinalOutputUserPrompt({
        partialLibraries,
        frameworkVocab,
        categoryRegistry,
        domain: job.domain,
        frameworkRules,
    });
    const userContent = buildFrameworkDomainFinalOutputUserContent(userPrompt);
    const llmPayload = buildFrameworkDomainFinalOutputLlmPayload({
        provider: domainInstruction.provider,
        model: domainInstruction.model,
        systemPrompt: instruction.systemPrompt,
        userPrompt,
    });

    await saveFrameworkDomainFinalOutputLlmPayload(job._id, llmPayload);

    const t0 = Date.now();
    const response = await generate({
        provider: domainInstruction.provider,
        model: domainInstruction.model,
        systemPrompt: instruction.systemPrompt,
        userContent,
        responseFormat: 'text',
    });
    console.LogColor(
        console.color.FgCyan,
        `${tag} ${domainInstruction.provider}/${domainInstruction.model} returned in ${Date.now() - t0}ms`
    );

    const text = typeof response === 'string' ? response.trim() : String(response ?? '').trim();
    if (!text) {
        throw new Error('Model returned an empty description');
    }

    const descriptionStorage = await uploadFrameworkDomainOutput({
        content: text,
        frameworkVersionId: job.frameworkVersionId,
        domain: job.domain,
    });

    await markFrameworkDomainFinalOutputCompleted(job._id, descriptionStorage);
    return { ok: true, id: job._id, descLen: text.length };
};

const processNextFrameworkDomainFinalOutput = async () => {
    const job = await pickAssignedFrameworkDomainFinalOutput();
    if (!job) {
        return null;
    }

    const tag = `[frameworkDomainFinalOutput ${job._id}]`;

    try {
        return await processFrameworkDomainFinalOutputJob(job);
    } catch (err) {
        console.LogColor(console.color.FgRed, `${tag} failed: ${err.message}`);
        await markFrameworkDomainFinalOutputRejected(job._id, err.message);
        return { ok: false, id: job._id, error: err.message };
    }
};

const runFrameworkDomainFinalOutputWorker = async ({
    maxItems = DEFAULT_MAX_ITEMS_PER_RUN,
} = {}) => {
    let processed = 0;
    let completedCount = 0;
    let failed = 0;

    while (processed < maxItems) {
        const result = await processNextFrameworkDomainFinalOutput();
        if (!result) {
            break;
        }

        processed += 1;
        if (result.ok) {
            completedCount += 1;
        } else {
            failed += 1;
        }
    }

    return { processed, completed: completedCount, failed };
};

module.exports = {
    pickAssignedFrameworkDomainFinalOutput,
    processNextFrameworkDomainFinalOutput,
    runFrameworkDomainFinalOutputWorker,
};
