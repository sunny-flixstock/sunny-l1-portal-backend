const { GetMD5Hash } = require('../utils/crypto');
const { getUrlFromKey } = require('../utils/CloudFront.s3');
const { getS3PreSignedpath } = require('../services/amazonS3Service');
const { thumbnailgenerationinit } = require('../EventListeners/TestListener.eventHandler');
const { thumbnailSize, FIXED_THUMB_BUCKET } = require('../config');

const thumbPathGenerator = async function (imageObject, isAwait = false) {
    const size = thumbnailSize;
    const imagePath = imageObject.imagePath.key;
    imageObject.name = imageObject.name || imagePath.split('/').pop();

    if (!!imageObject.thumbPath && !!imageObject.thumbPath.isValid) {
        return imageObject;
    }
    const hash = await GetMD5Hash(imagePath);
    const subHash = hash.substring(0, 3);
    imageObject.thumbPath = {
        key: `thumbs/${subHash}/${hash}.webp`,
        host: FIXED_THUMB_BUCKET,
        channel: imageObject.imagePath.channel,
        credentials: imageObject.imagePath.credentials,
    };
    if (isAwait) {
        await initializeThumbnailGeneration(imageObject, isAwait);
    } else {
        initializeThumbnailGeneration(imageObject, isAwait);
    }
    return imageObject;
};

const initializeThumbnailGeneration = async function (imageObject, isAwait = false) {
    const thumbPathPromise = getS3PreSignedpath(imageObject.thumbPath.key, 'image/jpeg', imageObject.thumbPath.host);
    const imagePathPromise = getUrlFromKey(imageObject.imagePath.key, undefined, imageObject.imagePath.host);

    return Promise.all([thumbPathPromise, imagePathPromise]).then(async values => {
        const { key: thumbPathKey, url: thumbPathUrl } = values[0];
        const { key: imagePathKey, url: imagePathUrl } = values[1];

        const payload = {
            imageKey: imagePathKey,
            imageUrl: imagePathUrl,
            thumbKey: thumbPathKey,
            thumbUrl: thumbPathUrl,
            size: thumbnailSize,
            _id: imageObject._id,
        };
        payload.imageObject = imageObject;
        if (!isAwait) {
            global.eventEmitter.emitSafe('thumbnail-generation-init', payload);
        } else {
            return await thumbnailgenerationinit(payload);
        }
    });
};

module.exports = Object.freeze({
    thumbPathGenerator,
    initializeThumbnailGeneration,
});
