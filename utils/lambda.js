const { sendMessageToSlackErrorChannel } = require('./slack');
const { default: axios } = require('axios');
const RetryQueueModel = require('../models/RetryQueue.model');

const Api400Error = require('../errors/api400Error');

module.exports.GetInsightFaceEmbedding = async function (bucket, key) {
    const url = 'https://fiil64fxpq774frt3ycichgc2q0gkaou.lambda-url.ap-south-1.on.aws/';
    // Function URL unwraps the Lambda's {statusCode, body} — data is the payload directly.
    // But guard against the wrapped shape too in case invocation mode changes.
    const unwrap = (data) => {
        if (data && typeof data === 'object' && 'body' in data && typeof data.body === 'string') {
            try { return JSON.parse(data.body); } catch { return {}; }
        }
        return data || {};
    };
    try {
        const result = await axios.post(
            url,
            { bucket, key },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return unwrap(result.data).embedding;
    } catch (error) {
        const status = error?.response?.status;
        const body = unwrap(error?.response?.data);
        const msg = body?.error ?? error.message;
        if (status === 400) throw new Api400Error(msg);
        throw new Error(`InsightFace Lambda error (${status}): ${msg}`);
    }
};

module.exports.ConvertImageToJpg = async function ({ inputBucket, inputKey, outputBucket, outputKey }) {
    const url = 'https://fcitoy2ro5.execute-api.ap-south-1.amazonaws.com/default/anyImageFormatToJPG';
    await axios.post(url, { inputBucket, inputKey, outputBucket, outputKey }, {
        headers: { 'Content-Type': 'application/json' },
    });
};

module.exports.InitializeThumbnailGeneration = async function (payload, imageObject, logOnError) {
    const url = 'https://5gktwc92sa.execute-api.ap-south-1.amazonaws.com/prod';
    try {
        const result = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return result;
    } catch (error) {
        console.log(error);
        if (error?.response?.data) error = error.response.data.error;
        else {
            error = JSON.stringify(error, Object.getOwnPropertyNames(error));
        }
        error = JSON.stringify(error);
        if (logOnError) {
            sendMessageToSlackErrorChannel(
                `Error Generating thumbnail:\n payload: ${JSON.stringify(payload)} \n error : ${error} \n imageObject: ${imageObject} \n`
            );
            await RetryQueueModel.create({
                queueType: 'thumbnailRetry',
                data: payload,
                failureReason: error,
                additionalData: imageObject,
            });
        }
        console.log(error);
    }
};
