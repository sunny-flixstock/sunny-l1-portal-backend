const fs = require('fs');
const crypto = require('crypto');

class EventRouter {
    constructor() {
        this.routes = [];
    }

    AddRoute(event, handler) {
        this.routes.push({ event, handler });
    }

    GetAllRoute() {
        return this.routes;
    }

    ApplyEventRouter = function () {
        if (!!this.routes && this.routes.length > 0) {
            for (let i = 0; i < this.routes.length; i++) {
                const eventRoute = this.routes[i];
                global.eventEmitter.on(eventRoute.event, this.wrapHandler(eventRoute.handler, eventRoute.event));
            }
        }
    };

    wrapHandler = function (handler, event) {
        return function (data) {
            const eventId = PreHandlerFunction(event, data);
            Promise.resolve(handler(data))
                .catch((err) => {
                    console.error(`Event handler failed for ${event}:`, err.message);
                })
                // TODO: once retry logic reads from EventCache, move cleanup to .then() only
                .finally(() => PostHandlerFunction(eventId));
        };
    };
}

const PreHandlerFunction = function (event, data) {
    try {
        const eventDirectory = `./EventCache`;
        if (!fs.existsSync(eventDirectory)) {
            fs.mkdirSync(eventDirectory);
        }
        const eventId = crypto.randomBytes(24).toString('hex');
        const eventFile = `${eventDirectory}/${eventId}.json`;
        const eventData = { event: event, data: data };
        fs.writeFileSync(eventFile, JSON.stringify(eventData));
        return eventId;
    } catch (error) {
        return null;
    }
};

const PostHandlerFunction = function (eventId) {
    if (eventId != null) {
        const eventDirectory = `./EventCache`;
        const eventFile = `${eventDirectory}/${eventId}.json`;
        try {
            fs.unlinkSync(eventFile);
        } catch (error) {
            console.log(error);
        }
    }
};

module.exports = EventRouter;
