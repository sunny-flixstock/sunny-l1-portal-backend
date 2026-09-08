const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const mammoth = require('mammoth');
const archiver = require('archiver');
const mongoose = require('mongoose');
const L1PayloadSessionModel = require('../models/L1PayloadSession.model');
const L1PayloadFileModel = require('../models/L1PayloadFile.model');
const Api400Error = require('../errors/api400Error');
const { generate } = require('./llm/llm.service');
const {
    unwrapUploadedConfig,
    applyExplicitFeedback,
    findClientAngleIdByName,
} = require('./l1FeedbackBatch.service');

const SOURCE_ROOT = path.resolve(__dirname, '..', 'L1_Feedback_Skill');
const EXTRACTION_PROMPT_PATH = path.join(SOURCE_ROOT, 'sys_payload_feedback_extraction.md');

const PAYLOAD_PROVIDER = process.env.L1_RCA_PROVIDER || 'anthropic';
const PAYLOAD_MODEL = process.env.L1_RCA_MODEL || 'claude-sonnet-4-6';

const todayDateString = () => new Date().toISOString().slice(0, 10);

// Raster formats a vision call can actually read. pptx can also embed
// vector art (emf/wmf) as decoration/logos -- never a real QC screenshot,
// and not something a vision model can interpret as an image, so those are
// deliberately skipped rather than sent.
const IMAGE_EXTENSION_MIME = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
};

/** Per-slide text + embedded screenshot images from a pptx. The SKU ID
 * (and often the angle) is a QC screenshot of the GATI portal pasted onto
 * the slide -- it is pixels, never typed text -- so this has to resolve
 * each slide's actual embedded image(s), not just its text runs. pptx
 * structure: `ppt/slides/slideN.xml` references images by relationship id
 * (`<a:blip r:embed="rIdX">`), and `ppt/slides/_rels/slideN.xml.rels` maps
 * that id to the real file under `ppt/media/`. Returns
 * `[{slideNumber, text, images: [{buffer, mimeType}]}]`, in slide order. */
const extractPptxSlides = (buffer) => {
    const zip = new AdmZip(buffer);
    const slideEntries = zip
        .getEntries()
        .filter((e) => /^ppt\/slides\/slide\d+\.xml$/.test(e.entryName))
        .sort((a, b) => Number(a.entryName.match(/slide(\d+)\.xml/)[1]) - Number(b.entryName.match(/slide(\d+)\.xml/)[1]));

    return slideEntries.map((entry) => {
        const slideNumber = Number(entry.entryName.match(/slide(\d+)\.xml/)[1]);
        const xml = entry.getData().toString('utf8');

        const textRuns = [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]);

        const relsEntry = zip.getEntry(`ppt/slides/_rels/slide${slideNumber}.xml.rels`);
        const relsXml = relsEntry ? relsEntry.getData().toString('utf8') : '';
        const relMap = new Map(
            [...relsXml.matchAll(/<Relationship Id="([^"]+)"[^>]*Target="([^"]+)"/g)]
                .filter(([, , target]) => target.includes('/media/'))
                .map(([, id, target]) => [id, target])
        );

        const embedIds = [...xml.matchAll(/<a:blip[^>]*r:embed="([^"]+)"/g)].map((m) => m[1]);
        const images = [];
        for (const embedId of embedIds) {
            const target = relMap.get(embedId);
            if (!target) continue;
            const ext = target.split('.').pop().toLowerCase();
            const mimeType = IMAGE_EXTENSION_MIME[ext];
            if (!mimeType) continue; // vector art (emf/wmf) or unrecognized -- skip
            const mediaPath = path.posix.normalize(path.posix.join('ppt/slides', target));
            const mediaEntry = zip.getEntry(mediaPath);
            if (!mediaEntry) continue;
            images.push({ buffer: mediaEntry.getData(), mimeType });
        }

        return { slideNumber, text: textRuns.join(' '), images };
    });
};

/** docx has no "slide" concept, and mammoth's raw-text extraction doesn't
 * surface embedded images at all -- so unlike pptx, this is text-only for
 * now. Flagged explicitly (not silently) since the real QC workflow this
 * was built for is pptx-based; a docx with SKU IDs only in pasted
 * screenshots would need the same image-extraction treatment added here
 * if that becomes a real path. */
const extractDocxText = async (buffer) => {
    const { value } = await mammoth.extractRawText({ buffer });
    return value
        .split(/\n{2,}/)
        .map((para, i) => `--- SECTION ${i + 1} ---\n${para.trim()}`)
        .join('\n\n');
};

/** Normalizes both source formats into one shape the extraction call
 * consumes: `{ documentText, images }`, images labeled with which
 * slide/section they came from (and their position on it, since a slide
 * commonly carries 2 screenshots -- a bad variant next to a good one). */
const extractDocumentContent = async (buffer, originalName) => {
    const lower = originalName.toLowerCase();
    if (lower.endsWith('.pptx')) {
        const slides = extractPptxSlides(buffer);
        const documentText = slides.map((s) => `--- SLIDE ${s.slideNumber} ---\n${s.text}`).join('\n\n');
        const images = slides.flatMap((s) =>
            s.images.map((img, i) => ({
                ...img,
                label: `SCREENSHOT FROM SLIDE ${s.slideNumber}${s.images.length > 1 ? ` (image ${i + 1} of ${s.images.length})` : ''}`,
            }))
        );
        return { documentText, images };
    }
    if (lower.endsWith('.docx')) {
        return { documentText: await extractDocxText(buffer), images: [] };
    }
    throw new Api400Error('feedbackDoc must be a .pptx or .docx file (legacy .ppt/.doc are not supported)');
};

const logSessionEvent = async (session, type, meta) => {
    session.events.push({ type, meta });
    await session.save();
};

/** One vision-enabled LLM call over the whole document -- asks for every
 * (skuId, angleName, variantIndex, feedbackText) it can identify, scoped to
 * the SKUs we actually have configs for. The SKU ID (and often the angle)
 * is read directly off each slide's pasted QC screenshot, not off any text
 * label -- `images` (one per embedded screenshot, labeled with its slide)
 * is what makes that possible; `documentText` supplies the typed
 * variant/feedback callouts alongside it. See
 * sys_payload_feedback_extraction.md for the exact contract. */
const extractFeedbackFromDocument = async (documentText, images, knownSkuIds) => {
    const systemPrompt = fs.readFileSync(EXTRACTION_PROMPT_PATH, 'utf8');
    const response = await generate({
        provider: PAYLOAD_PROVIDER,
        model: PAYLOAD_MODEL,
        systemPrompt,
        userContent: JSON.stringify({ documentText, knownSkuIds }),
        images,
        responseFormat: 'json',
    });
    return {
        extracted: Array.isArray(response?.extracted) ? response.extracted : [],
        unresolvedMentions: Array.isArray(response?.unresolvedMentions) ? response.unresolvedMentions : [],
    };
};

/** Merges every extracted feedback entry for one SKU into its raw config,
 * resolving the doc's human angle label to the config's real
 * clientAngleId first (findClientAngleIdByName), then reusing the exact
 * same mutation applyExplicitFeedback already uses for manually-entered
 * feedback in the SKU config upload tab. Returns { config, matchedCount,
 * warnings } -- never throws on an unresolved entry, since one bad match
 * shouldn't fail the whole SKU's file. */
const mergeFeedbackIntoConfig = (config, entriesForSku) => {
    let matchedCount = 0;
    const warnings = [];

    for (const entry of entriesForSku) {
        const clientAngleId = findClientAngleIdByName(config, entry.angleName);
        if (!clientAngleId) {
            warnings.push(
                `Feedback found for angle "${entry.angleName}" (variant ${entry.variantIndex}) but no matching angle in this SKU's config -- not merged.`
            );
            continue;
        }
        try {
            applyExplicitFeedback(config, [
                { clientAngleId, variantIndex: entry.variantIndex, feedbackText: entry.feedbackText },
            ]);
            matchedCount += 1;
            if (entry.matchConfidence === 'low') {
                warnings.push(
                    `Low-confidence match for angle "${entry.angleName}" variant ${entry.variantIndex} -- merged, but double-check it.`
                );
            }
        } catch (err) {
            warnings.push(`Angle "${entry.angleName}" matched but variant ${entry.variantIndex} does not exist -- not merged. (${err.message})`);
        }
    }

    return { config, matchedCount, warnings };
};

const processSessionInBackground = async (sessionId, rawFiles, docBuffer, docName) => {
    const session = await L1PayloadSessionModel.findById(sessionId);
    try {
        const { documentText, images } = await extractDocumentContent(docBuffer, docName);
        const knownSkuIds = [];
        const parsedBySkuId = new Map();

        for (const file of rawFiles) {
            try {
                const raw = JSON.parse(file.buffer.toString('utf8'));
                const fileSkuId = file.originalname.replace(/\.json$/i, '');
                const { realSkuId, config } = unwrapUploadedConfig(fileSkuId, raw);
                parsedBySkuId.set(realSkuId, config);
                knownSkuIds.push(realSkuId);
            } catch (err) {
                session.errors.push({ skuId: file.originalname, message: `Failed to parse: ${err.message}` });
            }
        }
        session.totalSkus = knownSkuIds.length;
        await session.save();
        await logSessionEvent(session, 'extraction_started', {
            totalSkus: knownSkuIds.length,
            docName,
            screenshotCount: images.length,
        });

        const { extracted, unresolvedMentions } = await extractFeedbackFromDocument(documentText, images, knownSkuIds);
        await logSessionEvent(session, 'extraction_completed', {
            entriesFound: extracted.length,
            unresolvedMentions: unresolvedMentions.length,
        });

        const entriesBySkuId = new Map();
        for (const entry of extracted) {
            if (!parsedBySkuId.has(entry.skuId)) continue; // extraction prompt is told not to do this, but don't trust it blindly
            if (!entriesBySkuId.has(entry.skuId)) entriesBySkuId.set(entry.skuId, []);
            entriesBySkuId.get(entry.skuId).push(entry);
        }

        for (const skuId of knownSkuIds) {
            const config = parsedBySkuId.get(skuId);
            const entriesForSku = entriesBySkuId.get(skuId) ?? [];
            const { matchedCount, warnings } = mergeFeedbackIntoConfig(config, entriesForSku);

            if (entriesForSku.length === 0) {
                warnings.unshift('No feedback found for this SKU anywhere in the document.');
            }

            await L1PayloadFileModel.findOneAndUpdate(
                { sessionId, skuId },
                { sessionId, skuId, content: JSON.stringify({ configData: { [skuId]: config } }, null, 2), matchedFeedbackCount: matchedCount, warnings },
                { upsert: true, new: true }
            );

            if (matchedCount > 0) {
                session.matchedCount += 1;
            } else {
                session.unmatchedCount += 1;
            }
            await session.save();
        }

        if (unresolvedMentions.length) {
            await logSessionEvent(session, 'unresolved_mentions', { unresolvedMentions });
        }

        session.status = 'completed';
        await session.save();
    } catch (err) {
        session.status = 'failed';
        session.errors.push({ message: err.message });
        await session.save();
    }
};

const createPayloadSession = async ({ rawFiles, docBuffer, docName, date, createdBy }) => {
    if (!Array.isArray(rawFiles) || !rawFiles.length) {
        throw new Api400Error('At least one raw <skuId>.json file is required');
    }
    if (!docBuffer) {
        throw new Api400Error('feedbackDoc is required');
    }

    const session = await L1PayloadSessionModel.create({
        date: date || todayDateString(),
        status: 'processing',
        sourceDocName: docName,
        createdBy,
        events: [{ type: 'session_created', meta: { fileCount: rawFiles.length, docName } }],
    });

    processSessionInBackground(session._id, rawFiles, docBuffer, docName).catch(async (err) => {
        await L1PayloadSessionModel.updateOne(
            { _id: session._id },
            { $set: { status: 'failed' }, $push: { errors: { message: err.message } } }
        );
    });

    return session.toObject();
};

const getPayloadSessionById = async (sessionId) => {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        throw new Api400Error('Invalid session id');
    }
    const session = await L1PayloadSessionModel.findById(sessionId).lean();
    if (!session) {
        throw new Api400Error(`Payload session not found: ${sessionId}`);
    }
    return session;
};

const listPayloadSessionFiles = async (sessionId) => {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        throw new Api400Error('Invalid session id');
    }
    return L1PayloadFileModel.find({ sessionId }).select({ content: 0 }).sort({ skuId: 1 }).lean();
};

const getPayloadSessionFilesWithContent = async (sessionId) => {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        throw new Api400Error('Invalid session id');
    }
    return L1PayloadFileModel.find({ sessionId }).sort({ skuId: 1 }).lean();
};

/** Streams a zip of every staged file for a session, laid out the same way
 * the local .claude/skills/l1-feedback convention does
 * (<date>/payload/input_payload/<skuId>.json), for local inspection/edits
 * before it's used elsewhere. */
const streamPayloadSessionZip = async (sessionId, res) => {
    const session = await getPayloadSessionById(sessionId);
    const files = await getPayloadSessionFilesWithContent(sessionId);

    res.attachment(`input_payload_${session.date}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    for (const file of files) {
        archive.append(file.content, { name: `${session.date}/payload/input_payload/${file.skuId}.json` });
    }
    await archive.finalize();
};

module.exports = {
    createPayloadSession,
    getPayloadSessionById,
    listPayloadSessionFiles,
    getPayloadSessionFilesWithContent,
    streamPayloadSessionZip,
};
