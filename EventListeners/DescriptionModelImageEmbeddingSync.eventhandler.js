const { syncDescriptionModelImageEmbedding } = require('../services/descriptionModelImageEmbedding/descriptionModelImageEmbedding.service');

const onDescriptionModelImageEmbeddingSync = async ({ docId }) => {
    try {
        await syncDescriptionModelImageEmbedding(docId);
    } catch (error) {
        console.LogColor(console.color.FgRed, `description-model-image-embedding-sync failed for docId ${docId}: ${error.message}`);
    }
};

module.exports = { onDescriptionModelImageEmbeddingSync };
