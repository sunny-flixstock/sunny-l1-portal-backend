const mongoose = require('mongoose');
const Path = require('./Path.schema');
const { GetMD5Hash } = require('../utils/crypto');
const { getUrlFromKey } = require('../utils/CloudFront.s3');
const { getS3PreSignedpath } = require('../services/amazonS3Service');
const { S3_BUCKET: s3_bucket, thumbnailSize, FIXED_THUMB_BUCKET } = require('../config');

const ImageSchema = new mongoose.Schema({
    name: String,
    description: String,
    imagePath: Path,
    thumbPath: Path,
    characteristics: Object,
});

ImageSchema.pre('save', function (next) {
    const size = thumbnailSize;
    const imagePath = this.imagePath.key;
    const bucketName = this.imagePath.host || s3_bucket;

    this.name = this.name || imagePath.split('/').pop();

    if (!!this.thumbPath && !!this.thumbPath.isValid) {
        next();
        return;
    }

    GetMD5Hash(imagePath).then(hash => {
        const subHash = hash.substring(0, 3);
        this.thumbPath = {
            key: `thumbs/${subHash}/${hash}.webp`,
            host: FIXED_THUMB_BUCKET,
            channel: this.imagePath.channel,
            credentials: this.imagePath.credentials,
        };

        const thumbPathPromise = getS3PreSignedpath(this.thumbPath.key, 'image/jpeg', FIXED_THUMB_BUCKET);
        const imagePathPromise = getUrlFromKey(this.imagePath.key, 2 * 24 * 60 * 60 * 1000, bucketName);

        Promise.all([thumbPathPromise, imagePathPromise]).then(values => {
            const { key: thumbPathKey, url: thumbPathUrl } = values[0];
            const { key: imagePathKey, url: imagePathUrl } = values[1];

            const payload = {
                imageKey: imagePathKey,
                imageUrl: imagePathUrl,
                thumbKey: thumbPathKey,
                thumbUrl: thumbPathUrl,
                size: size,
                _id: this._id,
            };
            payload.imageObject = this;
            global.eventEmitter.emitSafe('thumbnail-generation-init', payload);
            next();
        });
    });
});

module.exports = ImageSchema;
