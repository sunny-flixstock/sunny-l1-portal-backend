const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const { runDescriptionGroupWorker } = require('../../services/descriptionGroupWorker.service');

const LOCK_KEY = 'descriptionGroupWorker';
const LOCK_TTL_SECONDS = 60 * 60;
const SCHEDULE = '* * * * *';

async function run() {
    const results = await runDescriptionGroupWorker();
    const { processed, completed, failed } = results;

    if (processed) {
        console.LogColor(console.color.FgCyan, `[descriptionGroupWorker] ${JSON.stringify(results)}`);
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, run);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    console.LogColor(console.color.FgGreen, `[descriptionGroupWorker] scheduled (${SCHEDULE})`);
};
