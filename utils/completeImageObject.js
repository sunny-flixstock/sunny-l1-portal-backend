const { getUrlFromKey } = require('./CloudFront.s3');
const { S3_BUCKET: s3_bucket } = require('../config');

const completeImageObject = function (image) {
    if (!image || typeof image !== 'object') return image;

    if (image.imagePath?.key) {
        try {
            const channel = image.imagePath.channel || 's3';
            const host = image.imagePath.host || s3_bucket;
            if (channel === 's3') {
                try {
                    const { url } = getUrlFromKey(image.imagePath.key, undefined, host);
                    image.imagePath.url = url;
                } catch (err) {
                    image.imagePath.url = null;
                }
            } else {
                image.imagePath.url = null;
            }
        } catch (err) {
            image.imagePath.url = null;
        }
    }

    if (image.thumbPath?.key) {
        try {
            const channel = image.thumbPath.channel || 's3';
            const host = image.thumbPath.host || s3_bucket;
            if (channel === 's3') {
                try {
                    const { url } = getUrlFromKey(image.thumbPath.key, undefined, host);
                    image.thumbPath.url = url;
                } catch (err) {
                    image.thumbPath.url = null;
                }
            } else {
                image.thumbPath.url = null;
            }
        } catch (err) {
            image.thumbPath.url = null;
        }
    }

    return image;
};

module.exports = { completeImageObject };
