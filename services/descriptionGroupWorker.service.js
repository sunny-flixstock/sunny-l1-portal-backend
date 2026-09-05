const DescriptionGroupModel = require('../models/DescriptionGroup.model');
const ImageDescriptionModel = require('../models/ImageDescription.model');
const RuleModel = require('../models/Rule.model');
const { IMAGE_DESCRIPTION_STATUSES } = require('../models/ImageDescription.model');
const { getSystemInstructionById } = require('./systemInstruction.service');
const { getFrameworkVocabById } = require('./frameworkVocab.service');
const { getCategoryRegistryById } = require('./categoryRegistry.service');
const { generate } = require('./llm/llm.service');
const { uploadDescriptionGroupLlmPayload } = require('../models/PromptRegistry.model');

const { assigned, inProgress, completed, rejected } = IMAGE_DESCRIPTION_STATUSES;

const DEFAULT_MAX_ITEMS_PER_RUN = 250;

const pickAssignedDescriptionGroup = async () =>
    DescriptionGroupModel.findOneAndUpdate(
        { status: assigned },
        { $set: { status: inProgress, rejectionReason: '' } },
        { sort: { updatedAt: 1 }, new: true }
    ).lean();

const parseStoredDescription = (value) => {
    const text = String(value ?? '').trim();
    if (!text) {
        return null;
    }

    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const fetchCompletedDescriptions = async (imageDescriptionIds) => {
    const rows = await ImageDescriptionModel.find({
        _id: { $in: imageDescriptionIds ?? [] },
        status: completed,
    })
        .select({ description: 1 })
        .lean();

    return rows
        .map((row) => parseStoredDescription(row.description))
        .filter((entry) => entry != null && entry !== '');
};

const buildFrameworkRulesText = (rules) =>
    rules
        .map((rule) => `[${rule.priority}] [${rule.polarity}] ${rule.ruleText}`)
        .join('\n');

const fetchFrameworkRules = async (ruleIds) => {
    if (!ruleIds?.length) {
        return '';
    }

    const rules = await RuleModel.find({ _id: { $in: ruleIds } })
        .select({ polarity: 1, priority: 1, ruleText: 1 })
        .lean();

    return buildFrameworkRulesText(rules);
};

const buildDescriptionGroupUserPrompt = ({
    descriptions,
    frameworkVocab,
    categoryRegistry,
    domain,
    frameworkRules,
}) => ({
    mode: 'generate',
    descriptions,
    framework_vocab: frameworkVocab?.vocab ?? null,
    category_registry: categoryRegistry?.registry ?? null,
    domain,
    framework_rules: frameworkRules,
});

const buildDescriptionGroupUserContent = (userPrompt) =>
    JSON.stringify(userPrompt, null, 2);

const buildDescriptionGroupLlmPayload = ({
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

const saveDescriptionGroupLlmPayload = async (descriptionGroupId, payload) => {
    const storage = await uploadDescriptionGroupLlmPayload({
        descriptionGroupId,
        payload,
    });

    await DescriptionGroupModel.updateOne(
        { _id: descriptionGroupId, status: inProgress },
        { $set: { llmPayloadStorage: storage } }
    );

    return storage;
};

const markDescriptionGroupRejected = async (id, rejectionReason) => {
    await DescriptionGroupModel.updateOne(
        { _id: id, status: inProgress },
        {
            $set: {
                status: rejected,
                rejectionReason: String(rejectionReason ?? '').slice(0, 2000),
            },
        }
    );
};

const markDescriptionGroupCompleted = async (id, description) => {
    await DescriptionGroupModel.updateOne(
        { _id: id, status: inProgress },
        {
            $set: {
                description: String(description ?? ''),
                status: completed,
                rejectionReason: '',
            },
        }
    );
};

const processDescriptionGroupJob = async (job) => {
    const tag = `[descriptionGroup ${job._id}]`;

    const [instruction, descriptions, frameworkVocab, categoryRegistry, frameworkRules] =
        await Promise.all([
            getSystemInstructionById(job.frameworkCreationInstruction, {
                includeContent: true,
            }),
            fetchCompletedDescriptions(job.imageDescriptionIds),
            getFrameworkVocabById(job.frameworkVocabId),
            getCategoryRegistryById(job.categoryRegistryId),
            fetchFrameworkRules(job.ruleIds),
        ]);

    if (!instruction.systemPrompt?.trim()) {
        throw new Error(
            `System instruction has no content: ${job.frameworkCreationInstruction}`
        );
    }

    if (!descriptions.length) {
        throw new Error('No completed image descriptions available for this group');
    }

    const userPrompt = buildDescriptionGroupUserPrompt({
        descriptions,
        frameworkVocab,
        categoryRegistry,
        domain: job.domain,
        frameworkRules,
    });
    const userContent = buildDescriptionGroupUserContent(userPrompt);
    const llmPayload = buildDescriptionGroupLlmPayload({
        provider: job.provider,
        model: job.model,
        systemPrompt: instruction.systemPrompt,
        userPrompt,
    });

    await saveDescriptionGroupLlmPayload(job._id, llmPayload);

    const t0 = Date.now();
    const response = await generate({
        provider: job.provider,
        model: job.model,
        systemPrompt: instruction.systemPrompt,
        userContent,
        responseFormat: 'text',
    });
    console.LogColor(
        console.color.FgCyan,
        `${tag} ${job.provider}/${job.model} returned in ${Date.now() - t0}ms`
    );

    const text = typeof response === 'string' ? response.trim() : String(response ?? '').trim();
    if (!text) {
        throw new Error('Model returned an empty description');
    }

    await markDescriptionGroupCompleted(job._id, text);
    return { ok: true, id: job._id, descLen: text.length };
};

const processNextDescriptionGroup = async () => {
    const job = await pickAssignedDescriptionGroup();
    if (!job) {
        return null;
    }

    const tag = `[descriptionGroup ${job._id}]`;

    try {
        return await processDescriptionGroupJob(job);
    } catch (err) {
        console.LogColor(console.color.FgRed, `${tag} failed: ${err.message}`);
        await markDescriptionGroupRejected(job._id, err.message);
        return { ok: false, id: job._id, error: err.message };
    }
};

const runDescriptionGroupWorker = async ({
    maxItems = DEFAULT_MAX_ITEMS_PER_RUN,
} = {}) => {
    let processed = 0;
    let completedCount = 0;
    let failed = 0;

    while (processed < maxItems) {
        const result = await processNextDescriptionGroup();
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
    pickAssignedDescriptionGroup,
    processNextDescriptionGroup,
    runDescriptionGroupWorker,
};
