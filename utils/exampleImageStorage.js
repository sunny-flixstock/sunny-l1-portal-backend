const crypto = require('crypto');
const path = require('path');
const mime = require('mime-types');

const S3_PREFIX = 'framework_example_images';

const buildExampleImageStorageKey = (client, originalFileName, contentType) => {
    const normalizedClient = String(client).trim();
    const safeOriginal = String(originalFileName || 'upload').trim() || 'upload';

    let ext = mime.extension(contentType);
    if (!ext) {
        const fromName = path.extname(safeOriginal).replace(/^\./, '');
        ext = fromName || 'jpg';
    }

    const storageFileName = `${crypto.randomUUID()}.${ext}`;
    const key = `${S3_PREFIX}/${normalizedClient}/${storageFileName}`;

    return {
        key,
        storageFileName,
        originalFileName: safeOriginal,
    };
};

module.exports = {
    S3_PREFIX,
    buildExampleImageStorageKey,
};
