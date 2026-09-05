const { onEmbeddingSync } = require('./EmbeddingSync.eventhandler');
const EventRouter = require('../utils/EventRouter.class');

const eventRouter = new EventRouter();
eventRouter.AddRoute('embedding-sync', onEmbeddingSync);

module.exports = eventRouter;
