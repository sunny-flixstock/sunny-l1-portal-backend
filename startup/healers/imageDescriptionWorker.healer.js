const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const { runImageDescriptionWorker } = require('../../services/imageDescriptionWorker.service');

const LOCK_KEY = 'imageDescriptionWorker';
const LOCK_TTL_SECONDS = 60 * 60;
const SCHEDULE = '* * * * *';

async function run() {
    const results = await runImageDescriptionWorker();
    const { processed, completed, failed } = results;

    if (processed) {
        console.LogColor(console.color.FgCyan, `[imageDescriptionWorker] ${JSON.stringify(results)}`);
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, run);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    console.LogColor(console.color.FgGreen, `[imageDescriptionWorker] scheduled (${SCHEDULE})`);
};
