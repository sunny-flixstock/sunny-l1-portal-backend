const { syncSkuEmbedding } = require('../services/semanticSearch.service');

const onEmbeddingSync = async ({ sku }) => {
    try {
        await syncSkuEmbedding(sku);
    } catch (error) {
        console.LogColor(console.color.FgRed, `embedding-sync failed for sku ${sku?._id}: ${error.message}`);
    }
};

module.exports = { onEmbeddingSync };
