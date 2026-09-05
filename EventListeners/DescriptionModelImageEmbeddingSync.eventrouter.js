const { onDescriptionModelImageEmbeddingSync } = require('./DescriptionModelImageEmbeddingSync.eventhandler');
const EventRouter = require('../utils/EventRouter.class');

const eventRouter = new EventRouter();
eventRouter.AddRoute('description-model-image-embedding-sync', onDescriptionModelImageEmbeddingSync);

module.exports = eventRouter;
