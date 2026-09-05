const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const { reindex } = require('../../services/semanticSearch.service');

const LOCK_KEY = 'embeddingReindex';
const LOCK_TTL_SECONDS = 60 * 20; // 20 min safety net; explicit release frees it sooner on success
// sec min hour day month weekday — fires at second 0 of every 15th minute
const SCHEDULE = '0 */15 * * * *';

async function run() {
    const results = await reindex();
    if (results && (results.processed || results.failed)) {
        console.LogColor(console.color.FgCyan, `[embeddingReindex] ${JSON.stringify(results)}`);
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, run);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    console.LogColor(console.color.FgGreen, `[embeddingReindex] scheduled (${SCHEDULE})`);
};
