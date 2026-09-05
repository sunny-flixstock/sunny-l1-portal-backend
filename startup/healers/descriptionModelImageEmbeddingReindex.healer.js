const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const { reindex } = require('../../services/descriptionModelImageEmbedding/descriptionModelImageEmbedding.service');

const LOCK_KEY = 'descriptionModelImageEmbeddingReindex';
const LOCK_TTL_SECONDS = 60 * 20;
const SCHEDULE = '0 */15 * * * *';

async function run() {
    const results = await reindex();
    if (results && (results.processed || results.failed)) {
        console.LogColor(console.color.FgCyan, `[dmiEmbeddingReindex] ${JSON.stringify(results)}`);
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, run);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    console.LogColor(console.color.FgGreen, `[dmiEmbeddingReindex] scheduled (${SCHEDULE})`);
};
