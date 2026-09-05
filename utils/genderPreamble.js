/** Standard gender preamble text, used only as a fallback when a raw
 * uploaded SKU config doesn't already carry one -- never overrides a
 * value the config actually provides. Wording mirrors the real worked
 * examples in L1_Feedback_Skill/*.rca_populated.json. */
const buildDefaultGenderPreamble = (gender) => {
    const normalized = String(gender ?? '').toLowerCase();
    if (normalized !== 'male' && normalized !== 'female') {
        return null;
    }
    const upper = normalized.toUpperCase();
    const opposite = normalized === 'male' ? 'female' : 'male';
    return {
        text: `MODEL GENDER — the model is an adult ${upper} fashion model. Render a ${normalized} person with ${normalized} body proportions, physique, and hands throughout the ENTIRE image. This is REQUIRED even on headless, cropped, back-facing, side-profile, or detail shots where the face is not visible — the body and figure must unmistakably read as ${normalized}. Do NOT generate a ${opposite} figure.`,
        fetchedBy: 'gender',
    };
};

module.exports = { buildDefaultGenderPreamble };
