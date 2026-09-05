const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const {
    runFrameworkDomainFinalOutputWorker,
} = require('../../services/frameworkDomainFinalOutputWorker.service');

const LOCK_KEY = 'frameworkDomainFinalOutputWorker';
const LOCK_TTL_SECONDS = 60 * 60;
const SCHEDULE = '* * * * *';

async function run() {
    const results = await runFrameworkDomainFinalOutputWorker();
    const { processed, completed, failed } = results;

    if (processed) {
        console.LogColor(
            console.color.FgCyan,
            `[frameworkDomainFinalOutputWorker] ${JSON.stringify(results)}`
        );
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, run);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    console.LogColor(
        console.color.FgGreen,
        `[frameworkDomainFinalOutputWorker] scheduled (${SCHEDULE})`
    );
};
