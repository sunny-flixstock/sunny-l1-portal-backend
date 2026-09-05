const Api400Error = require('../errors/api400Error');
const { S3_BUCKET } = require('../config');
const { completeImageObject } = require('./completeImageObject');

const normalizeImagePathInput = (input) => {
    if (!input?.imagePath?.key) {
        throw new Api400Error('Each image requires imagePath.key');
    }

    const host = input.imagePath.host?.trim() || S3_BUCKET;
    const channel = input.imagePath.channel || 's3';

    return {
        name: input.name?.trim() || undefined,
        description: input.description?.trim() || undefined,
        imagePath: {
            channel,
            host,
            key: input.imagePath.key.trim(),
        },
    };
};

const buildSampleImages = (images) => {
    if (!Array.isArray(images)) {
        return [];
    }
    return images.map(normalizeImagePathInput);
};

const enrichAngleImages = (images) => {
    if (!Array.isArray(images)) {
        return [];
    }
    return images.map((image) => {
        if (!image) return image;
        const copy = { ...image };
        if (copy.imagePath || copy.thumbPath) {
            completeImageObject(copy);
        }
        return copy;
    });
};

const enrichBaseAngle = (doc) => {
    if (!doc) return doc;
    const plain = doc.toObject ? doc.toObject() : { ...doc };
    plain.sampleImages = enrichAngleImages(plain.sampleImages);
    return plain;
};

const enrichClientAngle = (doc) => {
    if (!doc) return doc;
    const plain = doc.toObject ? doc.toObject() : { ...doc };
    plain.referenceImages = enrichAngleImages(plain.referenceImages);
    return plain;
};

module.exports = {
    buildSampleImages,
    enrichBaseAngle,
    enrichClientAngle,
    enrichAngleImages,
};
