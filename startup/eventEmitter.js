const EventEmitter = require('events');
let eventEmitter;

module.exports = function () {
    if (!eventEmitter) {
        eventEmitter = new EventEmitter();

        EventEmitter.prototype.emitSafe = function (event, data) {
            const eventsList = eventEmitter.eventNames();
            if (eventsList.includes(event)) {
                EventEmitter.prototype.emit.call(this, event, data);
            } else {
                console.LogColor(
                    console.color.FgRed,
                    console.color.Underscore,
                    console.color.BgYellow,
                    `WARNING: Event ${event} does not exist. Please implement the event.`
                );
            }
        };
    }
    global.eventEmitter = eventEmitter;
    require('../EventListeners')();
    LogEventStructure();
};

const LogEventStructure = function () {
    let totalListeners = 0;
    const eventsList = eventEmitter.eventNames();
    if (eventsList.length > 0) {
        console.LogColor(console.color.FgGreen, `----------------EVENT STRUCTURE----------------`);
        for (let i = 0; i < eventsList.length; i++) {
            const eventName = eventsList[i];
            const listenerCount = eventEmitter.listenerCount(eventName);
            totalListeners += listenerCount;
            console.LogColor(console.color.FgYellow, `| Event: ${eventName} -> ${listenerCount} Listeners`);
        }
        console.LogColor(console.color.FgBlue, `| <======Total Listeners: ${totalListeners}======>`);
        console.LogColor(console.color.FgGreen, `------------------------------------------------------`);
    }
};
