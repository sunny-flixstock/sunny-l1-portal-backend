/**
 * Node port of .claude/skills/l1-feedback/scripts/trace_lib.py's nested
 * feedback-slot bookkeeping, operating on the plain `data` object stored on
 * an L1SkuTrace document instead of a JSON file on disk.
 *
 * Key convention (see the skill's SKILL.md for the full explanation):
 *   - A feedback slot with nothing to report is ALWAYS exactly
 *     { text: null, inferredError: null, inferredFix: null,
 *       RCA_Iteration_0: null } -- the placeholder key is always literally
 *     "RCA_Iteration_0", regardless of true nesting depth.
 *   - The moment a slot is given real content, its placeholder key is
 *     renamed to match true depth: RCA_Iteration_<depth>.
 */

const nullFeedback = () => ({
    text: null,
    inferredError: null,
    inferredFix: null,
    RCA_Iteration_0: null,
});

const findAngle = (skuData, clientAngleId) =>
    (skuData.gtom_L1_output || []).find((angle) => angle.clientAngleId === clientAngleId);

const findVariant = (skuData, clientAngleId, variantIndex) => {
    const angle = findAngle(skuData, clientAngleId);
    if (!angle) {
        throw new Error(`no angle with clientAngleId=${clientAngleId}`);
    }
    const variant = (angle.variants || []).find((v) => v.variantIndex === variantIndex);
    if (!variant) {
        throw new Error(`angle ${clientAngleId} has no variantIndex=${variantIndex}`);
    }
    return variant;
};

/**
 * Walk a variant's feedback chain to the slot where new feedback belongs.
 * Returns { owner, depth } where owner.feedback is the slot to write into.
 * Throws if an earlier call in the chain is still open.
 */
const locateSlot = (variant) => {
    let owner = variant;
    let depth = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const fb = owner.feedback;
        if (fb.text == null) {
            return { owner, depth };
        }
        const iterKey = `RCA_Iteration_${depth}`;
        const iteration = fb[iterKey];
        if (!iteration) {
            throw new Error(
                `variantIndex=${variant.variantIndex} has feedback.text set at depth ${depth} but ${iterKey} is still null -- run RCA diagnosis before adding new feedback here`
            );
        }
        const approved = iteration.approvedFix;
        if (!approved) {
            throw new Error(
                `variantIndex=${variant.variantIndex}'s ${iterKey} has not been approved yet -- resolve the open issue before layering new feedback on top of it`
            );
        }
        owner = approved;
        depth += 1;
    }
};

const setRejectFeedback = (variant, feedbackText) => {
    const { owner, depth } = locateSlot(variant);
    owner.rework = 'reject';
    owner.feedback = {
        text: feedbackText,
        inferredError: null,
        inferredFix: null,
        [`RCA_Iteration_${depth}`]: null,
    };
    return depth;
};

/** Deepest iteration that is diagnosed (candidates populated) but not yet
 * approved. Returns { iteration, depth } or null. */
const findOpenIssue = (variant) => {
    let owner = variant;
    let depth = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const fb = owner.feedback;
        if (fb.text == null) return null;
        const iterKey = `RCA_Iteration_${depth}`;
        const iteration = fb[iterKey];
        if (!iteration) return null; // populated text but not yet diagnosed
        if (iteration.approvedFix == null) return { iteration, depth };
        owner = iteration.approvedFix;
        depth += 1;
    }
};

/** Depth of a feedback slot whose text is set but whose RCA_Iteration_<depth>
 * is still null (diagnosis has not run for it yet). Returns depth or null. */
const findPendingDiagnosis = (variant) => {
    let owner = variant;
    let depth = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const fb = owner.feedback;
        if (fb.text == null) return null;
        const iterKey = `RCA_Iteration_${depth}`;
        const iteration = fb[iterKey];
        if (!iteration) return depth;
        const approved = iteration.approvedFix;
        if (!approved) return null; // diagnosed, awaiting HITL decision
        owner = approved;
        depth += 1;
    }
};

function* iterVariants(skuData) {
    for (const angle of skuData.gtom_L1_output || []) {
        for (const variant of angle.variants || []) {
            yield { angle, variant };
        }
    }
}

/**
 * Drop every variant whose feedback has never been populated (never
 * flagged), and drop any angle left with an empty variants list.
 * outfit_assembly_output / updatedOutfitSelction are never touched.
 */
const pruneUntouchedVariants = (skuData) => {
    for (const angle of skuData.gtom_L1_output || []) {
        angle.variants = (angle.variants || []).filter(
            (v) => v.feedback && v.feedback.text != null
        );
    }
    skuData.gtom_L1_output = (skuData.gtom_L1_output || []).filter(
        (angle) => (angle.variants || []).length > 0
    );
    return skuData;
};

module.exports = {
    nullFeedback,
    findAngle,
    findVariant,
    locateSlot,
    setRejectFeedback,
    findOpenIssue,
    findPendingDiagnosis,
    iterVariants,
    pruneUntouchedVariants,
};
