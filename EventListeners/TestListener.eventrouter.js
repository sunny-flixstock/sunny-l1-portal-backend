const TestEventHandlers = require('./TestListener.eventHandler');
const EventRouter = require('../utils/EventRouter.class');
const eventRouter = new EventRouter();

eventRouter.AddRoute('thumbnail-generation-init', TestEventHandlers.thumbnailgenerationinit);

module.exports = eventRouter;
