const PptxGenJS = require('pptxgenjs');
const { imageSize } = require('image-size');
const Api400Error = require('../errors/api400Error');
const { getPayloadSessionById, listFeedbackItems } = require('./l1PayloadSession.service');

// 13.33x7.5in widescreen -- pptxgenjs's LAYOUT_16x9. Image sits left, the
// SKU/Angle/Variant/feedback text block sits right, mirroring the same
// side-by-side layout the Feedback Verification tab uses on screen.
const SLIDE_W = 13.33;
const SLIDE_H = 7.5;
const IMAGE_MAX_W = 7.6;
const IMAGE_MAX_H = 6.5;
const IMAGE_X = 0.4;
const IMAGE_Y = 0.5;
const TEXT_X = 8.3;
const TEXT_W = SLIDE_W - TEXT_X - 0.4;

const fetchImageForSlide = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type');
    const { width, height, type } = imageSize(new Uint8Array(buffer));
    const mimeType = contentType?.startsWith('image/') ? contentType : `image/${type === 'jpg' ? 'jpeg' : type}`;
    return { buffer, width, height, mimeType };
};

// Nominal 96dpi to turn a real pixel size into an inches-based layout size
// (PowerPoint has no native "pixels" unit) -- this only ever affects how
// large the image is *placed* on the slide, never the embedded bytes,
// which are the exact original file regardless of this scale.
const PX_PER_INCH = 96;

/** Fits an image's real pixel aspect ratio inside the slide's image
 * bounding box, never upscaling past it and never distorting it. */
const fitImageBox = (width, height) => {
    const nativeW = width / PX_PER_INCH;
    const nativeH = height / PX_PER_INCH;
    const scale = Math.min(IMAGE_MAX_W / nativeW, IMAGE_MAX_H / nativeH, 1) || 1;
    return { w: nativeW * scale, h: nativeH * scale };
};

/** Builds a feedback deck for one Payload Creation session -- one slide per
 * merged feedback item, the exact original image (never resized/
 * recompressed) plus SKU ID + Angle name (both always shown) + Variant +
 * the feedback text. Purely a visibility/analysis artifact: has no
 * relationship to RCA or SKU config upload, mirrors the same data the
 * Feedback Verification tab already shows on screen. Returns a Node
 * Buffer ready to stream as a download. */
const buildFeedbackDeckPptx = async (sessionId) => {
    const session = await getPayloadSessionById(sessionId);
    const items = await listFeedbackItems(sessionId);
    if (!items.length) {
        throw new Api400Error('This session has no merged feedback items to build a deck from');
    }

    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: 'FEEDBACK_DECK', width: SLIDE_W, height: SLIDE_H });
    pptx.layout = 'FEEDBACK_DECK';

    for (const item of items) {
        const slide = pptx.addSlide();

        try {
            const { buffer, width, height, mimeType } = await fetchImageForSlide(item.imageUrl);
            const { w, h } = fitImageBox(width, height);
            const data = `data:${mimeType};base64,${buffer.toString('base64')}`;
            slide.addImage({
                data,
                x: IMAGE_X,
                y: IMAGE_Y + (IMAGE_MAX_H - h) / 2,
                w,
                h,
            });
        } catch (err) {
            slide.addText(`Image could not be loaded (${err.message})`, {
                x: IMAGE_X,
                y: IMAGE_Y,
                w: IMAGE_MAX_W,
                h: 1,
                color: 'CC0000',
                fontSize: 14,
                italic: true,
            });
        }

        // SKU ID and Angle name are always shown, even if something else
        // about this item is incomplete -- the two mandatory identifiers.
        slide.addText(
            [
                { text: `SKU: ${item.skuId}\n`, options: { bold: true, fontSize: 16 } },
                { text: `Angle: ${item.angleName ?? 'Unknown'}\n`, options: { bold: true, fontSize: 16 } },
                { text: `Variant: V${item.variantIndex + 1}`, options: { fontSize: 13, color: '595959' } },
            ],
            { x: TEXT_X, y: IMAGE_Y, w: TEXT_W, h: 1.6, valign: 'top' }
        );

        slide.addText('FEEDBACK', {
            x: TEXT_X,
            y: IMAGE_Y + 1.7,
            w: TEXT_W,
            h: 0.3,
            fontSize: 11,
            bold: true,
            color: '8C8C8C',
        });
        slide.addText(`"${item.feedbackText}"`, {
            x: TEXT_X,
            y: IMAGE_Y + 2.0,
            w: TEXT_W,
            h: 4.0,
            fontSize: 14,
            valign: 'top',
            wrap: true,
        });
    }

    const buffer = await pptx.write({ outputType: 'nodebuffer' });
    return { buffer, filename: `feedback_deck_${session.date}.pptx` };
};

module.exports = {
    buildFeedbackDeckPptx,
};
