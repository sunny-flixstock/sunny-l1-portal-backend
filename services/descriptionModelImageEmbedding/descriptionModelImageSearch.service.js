const DescriptionModelImage = require('../../models/DescriptionModelImage.model');
const DescriptionModel = require('../../models/DescriptionModel.model');
const vectorStore = require('./descriptionModelImageVectorStore.service');
const { generateEmbedding } = require('./descriptionModelImageEmbedding.service');
const { getUrlFromKey } = require('../../utils/CloudFront.s3');
const { getSkipAndLimitForPagination } = require('../../utils/pagination');
const { S3_BUCKET } = require('../../config');

// bucket + imageKey: S3 location of the query cropped face image
const searchByFaceImage = async ({ bucket, imageKey, modelIdentities, pageNum = 1, pageSize = 10 }) => {
    const identities = Array.isArray(modelIdentities) ? modelIdentities : [];
    const { skip, limit } = getSkipAndLimitForPagination({ pageNum, pageSize });

    const embedding = await generateEmbedding(bucket, imageKey);

    const { hits, total } = await vectorStore.searchByEmbedding({
        embedding,
        modelIdentities: identities,
        skip,
        limit,
    });

    if (!hits.length) return { data: [], total, pageNum, pageSize };

    const docIds = hits.map((h) => h.docId);
    const similarityByDoc = new Map(hits.map((h) => [h.docId, h.similarity]));

    const docs = await DescriptionModelImage.find({ _id: { $in: docIds }, isActive: true });
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));

    const uniqueIdentities = [...new Set(docs.map((d) => d.modelIdentity))];
    const models = await DescriptionModel.find({ modelIdentity: { $in: uniqueIdentities } });
    const modelByIdentity = new Map(models.map((m) => [m.modelIdentity, m.toObject()]));

    const data = docIds
        .map((id) => {
            const doc = byId.get(id);
            if (!doc) return null;
            const plain = doc.toObject();
            const { url } = getUrlFromKey(plain.croppedImage?.imagePath?.key, undefined, S3_BUCKET);
            if (plain.croppedImage?.imagePath) plain.croppedImage.imagePath.url = url;
            plain.modelObj = modelByIdentity.get(plain.modelIdentity) || null;
            return { ...plain, similarity: similarityByDoc.get(id) };
        })
        .filter(Boolean);

    return { data, total, pageNum, pageSize };
};

module.exports = { searchByFaceImage };
