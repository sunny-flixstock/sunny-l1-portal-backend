const axios = require('axios');
const mime = require('mime-types');

const IMAGE_FETCH_TIMEOUT_MS = 20000;
const SUPPORTED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif']);

/** Fetch an image URL into a { buffer, mimeType } pair suitable for
 * services/llm/llm.service.js's `images` param. Mirrors the same fetch
 * pattern already used in imageDescriptionWorker.service.js. */
const fetchImageBuffer = async (imageUrl) => {
    const mimeType = mime.lookup(imageUrl.split('?')[0]) || null;
    if (!mimeType || !SUPPORTED_IMAGE_MIMES.has(mimeType)) {
        throw new Error(`Unsupported or unknown image MIME type for ${imageUrl}: ${mimeType || 'unknown'}`);
    }

    const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: IMAGE_FETCH_TIMEOUT_MS,
    });

    return { buffer: Buffer.from(response.data), mimeType };
};

module.exports = { fetchImageBuffer };
