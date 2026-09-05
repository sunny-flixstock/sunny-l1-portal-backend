const crypto = require('crypto');
const path = require('path');
const mime = require('mime-types');

const BASE_ANGLE_IMAGE_PREFIX = 'base-angle-images';
const CLIENT_ANGLE_IMAGE_PREFIX = 'client-angle-images';

const buildAngleImageStorageKey = (prefix, client, originalFileName, contentType) => {
    const safeOriginal = String(originalFileName || 'upload').trim() || 'upload';

    let ext = mime.extension(contentType);
    if (!ext) {
        const fromName = path.extname(safeOriginal).replace(/^\./, '');
        ext = fromName || 'jpg';
    }

    const storageFileName = `${crypto.randomUUID()}.${ext}`;
    const key = client
        ? `${prefix}/${String(client).trim()}/${storageFileName}`
        : `${prefix}/${storageFileName}`;

    return {
        key,
        storageFileName,
        originalFileName: safeOriginal,
    };
};

const buildBaseAngleImageStorageKey = (originalFileName, contentType) =>
    buildAngleImageStorageKey(BASE_ANGLE_IMAGE_PREFIX, null, originalFileName, contentType);

const buildClientAngleImageStorageKey = (client, originalFileName, contentType) =>
    buildAngleImageStorageKey(CLIENT_ANGLE_IMAGE_PREFIX, client, originalFileName, contentType);

module.exports = {
    BASE_ANGLE_IMAGE_PREFIX,
    CLIENT_ANGLE_IMAGE_PREFIX,
    buildBaseAngleImageStorageKey,
    buildClientAngleImageStorageKey,
};
