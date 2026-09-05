const { onFilterUpdate } = require('./FilterCreation.eventhandler');
const EventRouter = require('../utils/EventRouter.class');

const eventRouter = new EventRouter();
eventRouter.AddRoute('filter-update', onFilterUpdate);

module.exports = eventRouter;
