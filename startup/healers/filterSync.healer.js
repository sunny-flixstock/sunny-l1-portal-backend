const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const SkuModel = require('../../models/Sku.model');
const { onFilterUpdate } = require('../../EventListeners/FilterCreation.eventhandler');

const LOCK_KEY = 'filterSync';
const LOCK_TTL_SECONDS = 60 * 20;
const SCHEDULE = '0 */15 * * * *';
const BATCH_SIZE = 200;

async function run() {
    let processed = 0;
    let failed = 0;
    let cursor = null;

    while (true) {
        const query = { filtersSynced: false };
        if (cursor) query._id = { $gt: cursor };

        const skus = await SkuModel.find(query).sort({ _id: 1 }).limit(BATCH_SIZE);
        if (!skus.length) break;

        const results = await Promise.allSettled(skus.map((sku) =>
            onFilterUpdate({ skuId: sku._id, clientName: sku.clientName, patternDict: sku.patternDict || {} })
        ));
        for (let i = 0; i < results.length; i++) {
            if (results[i].status === 'fulfilled') processed++;
            else {
                failed++;
                console.LogColor(console.color.FgRed, `[filterSync] sku ${skus[i]._id}: ${results[i].reason?.message}`);
            }
        }

        cursor = skus[skus.length - 1]._id;
        if (skus.length < BATCH_SIZE) break;
    }

    if (processed || failed) {
        console.LogColor(console.color.FgCyan, `[filterSync] ${JSON.stringify({ processed, failed })}`);
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, run);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    console.LogColor(console.color.FgGreen, `[filterSync] scheduled (${SCHEDULE})`);
};
