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
    getVariantOutput,
    listAllCandidateImages,
} = require('./l1FeedbackBatch.service');

const SOURCE_ROOT = path.resolve(__dirname, '..', 'L1_Feedback_Skill');
const EXTRACTION_PROMPT_PATH = path.join(SOURCE_ROOT, 'sys_payload_feedback_extraction.md');
const IMAGE_MATCHING_PROMPT_PATH = path.join(SOURCE_ROOT, 'sys_payload_image_matching.md');

const PAYLOAD_PROVIDER = process.env.L1_RCA_PROVIDER || 'anthropic';
const PAYLOAD_MODEL = process.env.L1_RCA_MODEL || 'claude-sonnet-4-6';

const todayDateString = () => new Date().toISOString().slice(0, 10);

// `.lean()` reads return a Buffer-typed field as the driver's raw BSON
// Binary wrapper (a plain object with a `.buffer` property), not a real
// Buffer -- Buffer.from() on that produces a silent empty buffer rather
// than an error. Handle every shape that can actually reach here (same
// helper as l1GenericFeedback.service's toBuffer).
const toBuffer = (raw) => {
    if (Buffer.isBuffer(raw)) return raw;
    if (raw?.buffer) return Buffer.from(raw.buffer);
    if (Array.isArray(raw?.data)) return Buffer.from(raw.data);
    return Buffer.from(raw ?? []);
};

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
 * (skuId, sourceLabel, feedbackText) it can identify, scoped to the SKUs we
 * actually have configs for. The QC PPT no longer states an angle or
 * variant anywhere -- that's resolved separately, per SKU, by
 * matchScreenshotsToVariants below, by comparing images directly. The SKU
 * ID is read directly off each slide's pasted QC screenshot, not off any
 * text label -- `images` (one per embedded screenshot, labeled with its
 * slide) is what makes that possible; `documentText` supplies the typed
 * feedback callouts alongside it. `sourceLabel` on each returned entry is
 * how the code reconnects it back to its actual image bytes for the
 * matching step. See sys_payload_feedback_extraction.md for the exact
 * contract. */
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

/** Fetches one remote image's raw bytes + mime type -- used to pull a SKU's
 * real candidate renders (from its config's own imageUrls) into a vision
 * call. Mirrors l1FeedbackDeck.service's fetchImageForSlide but without the
 * pixel-dimension read, which nothing here needs. */
const fetchImageBuffer = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type');
    const ext = url.split('.').pop()?.split(/[?#]/)[0]?.toLowerCase();
    const mimeType = contentType?.startsWith('image/') ? contentType : IMAGE_EXTENSION_MIME[ext] || 'image/jpeg';
    return { buffer, mimeType };
};

/** Stage B: for one SKU, figures out which of its real candidate images
 * each extracted screenshot actually shows -- the only signal left now
 * that the PPT doesn't name an angle/variant anymore. Fetches every real
 * candidate this SKU's config actually has (listAllCandidateImages) plus
 * each screenshot's already-in-hand image bytes, and asks one vision call
 * to match screenshots to candidates by visual content alone. Returns one
 * result per item in `items`, in the same order, as
 * `{ item, candidate, confidence, reasoning }` -- `candidate: null` when
 * the model couldn't confidently pick one (never forced). Never throws on
 * a fetch/LLM hiccup for this one SKU -- returns every item unmatched with
 * a reason instead, so one bad SKU can't take down the whole session. */
const matchScreenshotsToVariants = async (config, items) => {
    const candidates = listAllCandidateImages(config);
    if (!candidates.length) {
        return items.map((item) => ({ item, candidate: null, confidence: null, reasoning: 'This SKU has no candidate images to match against.' }));
    }

    try {
        const candidateImages = await Promise.all(
            candidates.map(async (c, i) => {
                const { buffer, mimeType } = await fetchImageBuffer(c.imageUrl);
                return { buffer, mimeType, label: `CANDIDATE ${i + 1}: ${c.angleName ?? 'Unknown angle'} V${c.variantIndex + 1}` };
            })
        );
        const screenshotImages = items.map((item, i) => ({
            buffer: item.screenshotImage.buffer,
            mimeType: item.screenshotImage.mimeType,
            label: `SCREENSHOT FOR ITEM ${i + 1}`,
        }));

        const systemPrompt = fs.readFileSync(IMAGE_MATCHING_PROMPT_PATH, 'utf8');
        const response = await generate({
            provider: PAYLOAD_PROVIDER,
            model: PAYLOAD_MODEL,
            systemPrompt,
            userContent: '',
            images: [...candidateImages, ...screenshotImages],
            responseFormat: 'json',
        });
        const matches = Array.isArray(response?.matches) ? response.matches : [];

        return items.map((item, i) => {
            const label = `SCREENSHOT FOR ITEM ${i + 1}`;
            const match = matches.find((m) => m.itemLabel === label) ?? matches[i];
            const candidateNumber = match?.matchedCandidate;
            const candidate = Number.isInteger(candidateNumber) ? candidates[candidateNumber - 1] : null;
            return {
                item,
                candidate: candidate ?? null,
                confidence: match?.confidence ?? null,
                reasoning: match?.reasoning ?? null,
            };
        });
    } catch (err) {
        return items.map((item) => ({ item, candidate: null, confidence: null, reasoning: `Image-matching call failed: ${err.message}` }));
    }
};

/** Merges every screenshot-matched feedback entry for one SKU into its raw
 * config, using the exact (clientAngleId, variantIndex) matchScreenshotsToVariants
 * already resolved -- no more label fuzzy-matching, since the source
 * document no longer gives a label to match. Reuses the same mutation
 * applyExplicitFeedback already uses for manually-entered feedback in the
 * SKU config upload tab. Returns { config, matchedCount, warnings,
 * mergedItems } -- never throws on an unmatched entry, since one bad match
 * shouldn't fail the whole SKU's file. `mergedItems` (one per
 * successfully-merged entry, carrying both the real image URL it was
 * mapped to AND the original screenshot) is what the Feedback Verification
 * tab renders side by side -- kept as individual records, not just the
 * aggregate count, specifically so a human can visually confirm each one
 * before this goes anywhere near RCA. */
const mergeFeedbackIntoConfig = (config, matchResults) => {
    let matchedCount = 0;
    const warnings = [];
    const mergedItems = [];

    for (const { item, candidate, confidence, reasoning } of matchResults) {
        if (!candidate) {
            warnings.push(
                `Feedback "${item.feedbackText.slice(0, 80)}" (${item.sourceLabel}) could not be confidently matched to any of this SKU's candidate images -- not merged.${reasoning ? ` (${reasoning})` : ''}`
            );
            continue;
        }
        try {
            applyExplicitFeedback(config, [
                { clientAngleId: candidate.clientAngleId, variantIndex: candidate.variantIndex, feedbackText: item.feedbackText },
            ]);
            matchedCount += 1;
            mergedItems.push({
                clientAngleId: candidate.clientAngleId,
                angleName: candidate.angleName,
                variantIndex: candidate.variantIndex,
                feedbackText: item.feedbackText,
                matchConfidence: confidence ?? null,
                matchReasoning: reasoning ?? null,
                imageUrl: getVariantOutput(config, candidate.clientAngleId, candidate.variantIndex),
                screenshotImage: { data: item.screenshotImage.buffer, mimeType: item.screenshotImage.mimeType },
                verification: { status: 'pending' },
            });
            if (confidence === 'low') {
                warnings.push(
                    `Low-confidence image match for "${candidate.angleName}" V${candidate.variantIndex + 1} (${item.sourceLabel}) -- merged, but double-check it.`
                );
            }
        } catch (err) {
            warnings.push(`Matched "${candidate.angleName}" V${candidate.variantIndex + 1} (${item.sourceLabel}) but could not merge -- (${err.message})`);
        }
    }

    return { config, matchedCount, warnings, mergedItems };
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

        // Stage A only names each item's screenshot by its sourceLabel
        // (e.g. "SCREENSHOT FROM SLIDE 4 (image 1 of 2)") -- reconnect that
        // back to the actual image bytes extractDocumentContent already
        // pulled out of the pptx, since Stage B (image matching) needs the
        // real pixels, not just a label.
        const imagesByLabel = new Map(images.map((img) => [img.label, img]));
        const unmatchedLabelWarnings = [];
        const entriesBySkuId = new Map();
        for (const entry of extracted) {
            if (!parsedBySkuId.has(entry.skuId)) continue; // extraction prompt is told not to do this, but don't trust it blindly
            const screenshotImage = imagesByLabel.get(entry.sourceLabel);
            if (!screenshotImage) {
                unmatchedLabelWarnings.push(`SKU ${entry.skuId}: extracted entry referenced "${entry.sourceLabel}" but no image with that label was found -- skipped.`);
                continue;
            }
            if (!entriesBySkuId.has(entry.skuId)) entriesBySkuId.set(entry.skuId, []);
            entriesBySkuId.get(entry.skuId).push({ ...entry, screenshotImage: { buffer: screenshotImage.buffer, mimeType: screenshotImage.mimeType } });
        }

        for (const skuId of knownSkuIds) {
            const config = parsedBySkuId.get(skuId);
            const itemsForSku = entriesBySkuId.get(skuId) ?? [];
            const matchResults = itemsForSku.length ? await matchScreenshotsToVariants(config, itemsForSku) : [];
            const { matchedCount, warnings, mergedItems } = mergeFeedbackIntoConfig(config, matchResults);

            if (itemsForSku.length === 0) {
                warnings.unshift('No feedback found for this SKU anywhere in the document.');
            }
            warnings.push(...unmatchedLabelWarnings.filter((w) => w.startsWith(`SKU ${skuId}:`)));

            await L1PayloadFileModel.findOneAndUpdate(
                { sessionId, skuId },
                {
                    sessionId,
                    skuId,
                    content: JSON.stringify({ configData: { [skuId]: config } }, null, 2),
                    matchedFeedbackCount: matchedCount,
                    mergedItems,
                    warnings,
                },
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

const listPayloadSessions = async () => {
    return L1PayloadSessionModel.find().sort({ createdAt: -1 }).limit(50).lean();
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

/** Flat list of every individually-merged feedback item across a session's
 * files, one entry per (skuId, clientAngleId, variantIndex) -- what the
 * Feedback Verification tab renders one card per, each carrying enough to
 * both display (`imageUrl` the AI-matched candidate, `screenshotImageUrl`
 * the original QC screenshot it was matched from, `angleName`,
 * `feedbackText`, `matchConfidence`/`matchReasoning`) and to write a
 * decision back (`skuId` + `itemIndex`, its position within that SKU's own
 * `mergedItems` array). The stored `screenshotImage` Buffer is converted
 * to a `data:` URL here (never handed out as a raw Buffer) so the frontend
 * can drop it straight into an `<img src>` next to the matched candidate. */
const listFeedbackItems = async (sessionId) => {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        throw new Api400Error('Invalid session id');
    }
    const files = await L1PayloadFileModel.find({ sessionId }).select({ skuId: 1, mergedItems: 1 }).sort({ skuId: 1 }).lean();
    const items = [];
    files.forEach((file) => {
        (file.mergedItems ?? []).forEach(({ screenshotImage, ...item }, itemIndex) => {
            const screenshotImageUrl = screenshotImage?.data
                ? `data:${screenshotImage.mimeType};base64,${toBuffer(screenshotImage.data).toString('base64')}`
                : null;
            items.push({ skuId: file.skuId, itemIndex, ...item, screenshotImageUrl });
        });
    });
    return items;
};

/** Records a human's visual verification of one extracted feedback item --
 * "is this actually mapped to the right image/SKU/angle/variant, and does
 * the feedback make sense for it" -- before it's ever sent onward to RCA.
 * Purely a review annotation: does not touch the underlying config/content,
 * so a "wrong" verdict doesn't silently drop or alter anything here -- the
 * human is expected to go fix the source (re-run Payload Creation, or hand-
 * edit before using SKU config upload) themselves. */
const verifyFeedbackItem = async (sessionId, skuId, itemIndex, { status, verifiedBy }) => {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        throw new Api400Error('Invalid session id');
    }
    if (status !== 'correct' && status !== 'wrong') {
        throw new Api400Error('status must be "correct" or "wrong"');
    }
    const file = await L1PayloadFileModel.findOne({ sessionId, skuId });
    if (!file) {
        throw new Api400Error(`No payload file for sku=${skuId} in session ${sessionId}`);
    }
    const item = file.mergedItems?.[itemIndex];
    if (!item) {
        throw new Api400Error(`No merged item at index ${itemIndex} for sku=${skuId}`);
    }
    item.verification = { status, verifiedAt: new Date(), verifiedBy: verifiedBy ?? null };
    await file.save();
    return { skuId, itemIndex, verification: item.verification };
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
    listPayloadSessions,
    getPayloadSessionById,
    listPayloadSessionFiles,
    getPayloadSessionFilesWithContent,
    listFeedbackItems,
    verifyFeedbackItem,
    streamPayloadSessionZip,
};
