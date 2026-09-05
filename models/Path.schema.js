const mongoose = require('mongoose');
const { getUrlFromKey } = require('../utils/CloudFront.s3');
const { S3_BUCKET: s3_bucket } = require('../config');

const pathSchema = new mongoose.Schema(
    {
        channel: {
            type: String,
            default: 's3',
        },
        host: { type: String, default: s3_bucket, required: true },
        key: { type: String, required: true },
        credentials: { type: String, default: null },
        url: { type: String, default: null },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

pathSchema.virtual('isValid').get(function () {
    return !!this.key && this.key.length > 0;
});

const getUrl = function (channel, host, key) {
    if (channel === 's3') {
        try {
            return getUrlFromKey(key, undefined, host || s3_bucket);
        } catch (err) {
            return { key, url: null };
        }
    }
    return { key, url: null };
};

pathSchema.post('save', function (doc) {
    const { channel, host, key } = doc;
    const { url } = getUrl(channel, host, key);
    doc.url = url;
});

pathSchema.post('init', function (doc) {
    const { channel, host, key } = doc;
    const { url } = getUrl(channel, host, key);
    doc.url = url;
});

module.exports = pathSchema;
