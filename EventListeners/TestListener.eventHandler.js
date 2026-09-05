const { InitializeThumbnailGeneration } = require('../utils/lambda');
const { sendMessageToSlackErrorChannel } = require('../utils/slack');

const thumbnailgenerationinit = async function ({ _id, imageUrl, thumbUrl, size, imageObject, logOnError = true }) {
    try {
        await InitializeThumbnailGeneration(
            {
                _id,
                imageUrl,
                thumbUrl,
                size,
            },
            imageObject,
            logOnError
        );
        console.log('Thumbnail Generation Done.');
    } catch (error) {
        sendMessageToSlackErrorChannel(`Error Generating thumbnail:\n imageUrl: ${imageUrl} \n imageObjectId : ${_id} \n error: ${error} \n`);
        console.log(error);
    }
};

module.exports = Object.freeze({
    thumbnailgenerationinit,
});
