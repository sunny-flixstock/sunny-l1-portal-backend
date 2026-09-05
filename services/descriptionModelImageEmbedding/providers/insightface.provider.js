const { GetInsightFaceEmbedding } = require('../../../utils/lambda');

const embed = (bucket, s3Key) => GetInsightFaceEmbedding(bucket, s3Key);

module.exports = { embed };
