module.exports = function start() {
    require('./healers/ingestionSweep.healer')();
    require('./healers/thumbnailRetry.healer')();
    require('./healers/embeddingReindex.healer')();
    require('./healers/descriptionModelImageEmbeddingReindex.healer')();
    require('./healers/filterSync.healer')();
    require('./healers/skuDescription.healer')();
    require('./healers/frameworkCreationReconciler.healer')();
    require('./healers/imageDescriptionWorker.healer')();
    require('./healers/descriptionGroupWorker.healer')();
    require('./healers/frameworkDomainFinalOutputWorker.healer')();
};
