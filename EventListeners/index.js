module.exports = function () {
    require('./TestListener.eventrouter').ApplyEventRouter();
    require('./FilterCreation.eventrouter').ApplyEventRouter();
    require('./EmbeddingSync.eventrouter').ApplyEventRouter();
    require('./DescriptionModelImageEmbeddingSync.eventrouter').ApplyEventRouter();
};
