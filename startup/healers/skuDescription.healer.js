const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const { generateForAllMissing } = require('../../services/skuImageDescription.service');

const LOCK_KEY = 'skuDescription';
const LOCK_TTL_SECONDS = 60 * 60; // 1h safety net; Gemini calls can be slow
const SCHEDULE = '0 */30 * * * *';

async function run() {
    const results = await generateForAllMissing();
    if (results && (results.processed || results.failed || results.skippedNoImages)) {
        console.LogColor(console.color.FgCyan, `[skuDescription] ${JSON.stringify(results)}`);
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, run);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    console.LogColor(console.color.FgGreen, `[skuDescription] scheduled (${SCHEDULE})`);
};
