const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const SkuModel = require('../../models/Sku.model');
const { generateForSku } = require('../../services/skuImageDescription.service');

const LOCK_KEY = 'ingestionSweep';
const LOCK_TTL_SECONDS = 5 * 60; // 5 min safety net; explicit release frees it sooner on success
// min hour day month weekday — fires every minute
const SCHEDULE = '* * * * *';
const BATCH_SIZE = 25;
const CONCURRENCY = 5;
const RETRY_BACKOFF_MS = 1 * 60 * 1000;

async function processSku(sku) {
    try {
        await generateForSku(sku);
        await SkuModel.updateOne(
            { _id: sku._id },
            { $unset: { ingestionScheduledAt: '' } }
        );
    } catch (err) {
        console.LogColor(console.color.FgRed, `[ingestionSweep] sku ${sku._id} failed: ${err.message}`);
        await SkuModel.updateOne(
            { _id: sku._id },
            { $set: { ingestionScheduledAt: new Date(Date.now() + RETRY_BACKOFF_MS) } }
        );
    }
}

async function sweep() {
    const now = new Date();
    const due = await SkuModel.find({
        isActive: true,
        ingestionScheduledAt: { $lte: now },
        enableFXGTOM: { $ne: false },
    }).limit(BATCH_SIZE);

    if (!due.length) return;
    console.LogColor(console.color.FgCyan, `[ingestionSweep] picked ${due.length} sku(s)`);

    for (let i = 0; i < due.length; i += CONCURRENCY) {
        await Promise.allSettled(due.slice(i, i + CONCURRENCY).map(processSku));
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, sweep);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    tick();
    console.LogColor(console.color.FgGreen, `[ingestionSweep] scheduled (${SCHEDULE})`);
};
