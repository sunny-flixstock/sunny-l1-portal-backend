const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const EncodeS3Key = require('../utils/EncodeS3Key');

const cloudFrontConfig = {
    'metamodels-ai': {
        domainName2: 'd3spog5ynbbnq2.cloudfront.net',
        domainName: 'metamodels.flixstock.com',
        accesskey: 'APKATRM5WITXIGMSWAEV',
        key: '',
    },
    flixstudio: {
        domainName2: 'd3ahvn09k152cs.cloudfront.net',
        domainName: 'flixstd.flixstock.com',
        accesskey: 'APKATRM5WITXIGMSWAEV',
        key: '',
    },
    fxgati: {
        domainName2: 'd3o1ipxhazrpeh.cloudfront.net',
        domainName: 'fxgati.flixstock.com',
        accesskey: 'APKATRM5WITXIGMSWAEV',
        key: '',
    },
    'flixstock-sftp': {
        domainName2: 'd1rmuz0uxl077r.cloudfront.net',
        domainName: 'secureftp.flixstock.com',
        accesskey: 'APKATRM5WITXIGMSWAEV',
        key: '',
    },
    bzt: {
        domainName: 'd55wl1zttsyjg.cloudfront.net',
        accesskey: 'AKIAT34NDO7HQMNUUM7R',
        key: '',
    },
    fxfedbck: {
        domainName2: 'd2qsifyuxh5l69.cloudfront.net',
        domainName: 'fxfedbck.flixstock.com',
        accesskey: 'APKATRM5WITXIGMSWAEV',
        key: '',
    },
    "bzt-flix-datasync":{
        domainName:"bzt-flix-datasync.flixstock.com",
        accesskey: 'APKATRM5WITXIGMSWAEV',
        key:""
    }
};

const PEMKeyFileName = {
    flixstudio: 'fxgati',
    fxgati: 'fxgati',
    fxfedbck: 'fxgati',
    'flixstock-sftp': 'fxgati',
};

const getPrivateKeyFromFile = bucketName => {
    try {
        const privateKey = path.join(__dirname, `../CF-Keys/${PEMKeyFileName[bucketName]}.pem`);
        const result = fs.readFileSync(privateKey, 'utf8');
        return result;
    } catch (e) {
        throw new Error('Key file not found.');
    }
};

const getPrivateKey = function (bucketName) {
    try {
        if (cloudFrontConfig[bucketName]) {
            const { key } = cloudFrontConfig[bucketName];
            if (!!key) {
                return key;
            } else {
                const privateKey = getPrivateKeyFromFile(bucketName);
                cloudFrontConfig[bucketName].key = privateKey;
                return privateKey;
            }
        } else {
            throw new Error('Bucket name not found.');
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const getUrlFromKey = function (key, expireTime = 2 * 24 * 60 * 60 * 1000, bucketName) {
    try {
        if (bucketName == 'flixstudio' || bucketName == 'flixstock-sftp' || bucketName == 'metamodels-ai' || bucketName == 'bzt-flix-datasync' || bucketName == 'fxgati') {
            const { domainName } = cloudFrontConfig[bucketName];
            const url = `https://${domainName}/${EncodeS3Key(key)}`;
            return { key, url: url };
        } else {
            if (!!cloudFrontConfig[bucketName]) {
                const privateKey = getPrivateKey(bucketName);
                const { domainName, accesskey } = cloudFrontConfig[bucketName];
                const signer = new AWS.CloudFront.Signer(accesskey, privateKey);
                const url = `https://${domainName}/${EncodeS3Key(key)}`;
                const signedUrl = signer.getSignedUrl({
                    url: url,
                    expires: Math.floor((Date.now() + expireTime) / 1000),
                });
                return { key, url: signedUrl };
            } else {
                throw new Error('Bucket name not found.');
            }
        }
    } catch (e) {
        throw e;
    }
};

module.exports = Object.freeze({
    getUrlFromKey,
});
