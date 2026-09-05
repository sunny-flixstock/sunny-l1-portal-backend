const buildClientAngleSystemPrompt = ({
    instructionPrompt,
    baseAngleName,
    baseDefinitionMarkdown,
}) => {
    const instruction = String(instructionPrompt ?? '').trim();
    const baseName = String(baseAngleName ?? '').trim();
    const definition = String(baseDefinitionMarkdown ?? '').trim();

    const referenceBlock = [
        'REFERENCE DEFINITIONS:',
        `=== ${baseName}.md ===`,
        definition,
    ].join('\n');

    if (!instruction) {
        return referenceBlock;
    }

    return `${instruction}\n\n${referenceBlock}`;
};

const buildClientAngleUserPrompt = ({ client, baseAngleName, imageCount }) => {
    const clientCode = String(client ?? '').trim();
    const baseName = String(baseAngleName ?? '').trim();
    const count = Number(imageCount) || 0;

    return `Below are ${count} example images for client "${clientCode}", angle type "${baseName}".

Analyse these images carefully:
- What part of the body / garment is in frame?
- How is the model oriented (front-facing, back-facing, side, three-quarter)?
- Is this a full-body, half-body, or detail/close-up crop?
- What garment or product detail is being highlighted?
- What is the commercial purpose of this framing?

Using ONLY what you observe in the images, write a complete shot-type definition .md file for this angle type, following the exact structure and style of the reference definitions above.

Give the angle type a clear, descriptive name derived from "${baseName}" and what you observe, adapted for client "${clientCode}" (e.g. "Front Crop", "Back Crop", "Detail Close-Up A", etc.).

Output ONLY the raw Markdown — no code fences, no preamble.`;
};

module.exports = {
    buildClientAngleSystemPrompt,
    buildClientAngleUserPrompt,
};
