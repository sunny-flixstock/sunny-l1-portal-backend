const AWS = require('aws-sdk');
const config = require('../config');

const Initialize = function () {
    try {
        AWS.config.update({
            signatureVersion: 'v4',
            region: config.S3_REGION,
        });
        if (!!config?.AWS_ACCESS_KEY && !!config?.AWS_SECRET_KEY) {
            AWS.config.update({
                credentials: {
                    accessKeyId: config?.AWS_ACCESS_KEY,
                    secretAccessKey: config?.AWS_SECRET_KEY,
                },
            });
            console.log(`INFO: AWS credentials loaded from env:${!AWS.config.credentials ? 'failed' : 'success'}`);
        } else {
            throw new Error('ERROR: AWS credentials not found');
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

Initialize();

const s3 = new AWS.S3();

// Pre-signed PUT URL for image/asset uploads
const getS3PreSignedpath = async (basepath, mimeType = 'image/jpeg', bucket) => {
    try {
        const params = {
            Bucket: bucket || config.S3_BUCKET,
            Key: basepath,
            Expires: 60 * 60,
            ContentType: mimeType,
        };
        const url = s3.getSignedUrl('putObject', params);
        return { key: basepath, url: url };
    } catch (error) {
        throw error;
    }
};

// Signed GET URL for an S3 object
const getS3Url = (bucketName, key) => {
    try {
        const params = {
            Bucket: bucketName,
            Key: key,
            Expires: 60 * 60 * 24 * 7,
        };
        const url = s3.getSignedUrl('getObject', params);
        return { key, url };
    } catch (error) {
        throw error;
    }
};

// Fetch file from S3 as a Buffer (returns full S3 data object — use .Body for the buffer)
const getFileFromS3 = async ({ key, bucketName }) => {
    const params = {
        Bucket: bucketName || config.S3_BUCKET,
        Key: key,
    };
    return new Promise((resolve, reject) => {
        return s3.getObject(params, (err, data) => {
            if (err) return reject(err);
            resolve(data);
        });
    });
};

// Fetch file from S3 as a readable stream
const getFileFromS3Stream = async ({ key, bucketName }) => {
    const params = {
        Bucket: bucketName || config.S3_BUCKET,
        Key: key,
    };
    return s3.getObject(params).createReadStream();
};

// Check if an S3 object exists
const checkIfObjectExists = async (bucketName, objectKey) => {
    try {
        const params = {
            Bucket: bucketName,
            Key: objectKey,
        };
        await s3.headObject(params).promise();
        return true;
    } catch (err) {
        if (err.code === 'NotFound') {
            return false;
        }
        throw err;
    }
};

// Upload a Buffer directly to S3
const uploadFileBufferToS3 = async (file, key, bucket, contentType) => {
    const params = {
        Bucket: bucket || config.S3_BUCKET,
        Key: key,
        Body: file,
        ...(contentType && { ContentType: contentType }),
    };
    return new Promise((resolve, reject) => {
        return s3.upload(params, (err, data) => {
            if (err) return reject(err);
            resolve(data.Location);
        });
    });
};

// Copy an S3 object to another location
const copyS3FiletoLocation = async (destBucketName, srcBucketName, srcFileKey, destFileKey) => {
    const params = {
        Bucket: destBucketName,
        CopySource: `/${srcBucketName}/${srcFileKey}`,
        Key: destFileKey,
    };
    await s3.copyObject(params).promise();
};

// Get S3 object metadata via headObject
const getMetaData = async (bucketName, objectKey) => {
    try {
        const params = {
            Bucket: bucketName,
            Key: objectKey,
        };
        const metadata = await s3.headObject(params).promise();
        return metadata;
    } catch (err) {
        return err.code;
    }
};

module.exports = {
    getS3PreSignedpath,
    getS3Url,
    getFileFromS3,
    getFileFromS3Stream,
    checkIfObjectExists,
    uploadFileBufferToS3,
    copyS3FiletoLocation,
    getMetaData,
};
