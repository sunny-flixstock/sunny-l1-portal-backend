const cron = require('node-cron');
const { withLock } = require('../../utils/cronLock');
const { reconcileFrameworkCreation } = require('../../services/frameworkCreationReconciler.service');

const LOCK_KEY = 'frameworkCreationReconciler';
const LOCK_TTL_SECONDS = 6 * 60;
const SCHEDULE = '0 */5 * * * *';

async function run() {
    const results = await reconcileFrameworkCreation();
    const {
        imageDescriptionsRetried,
        imageDescriptionsAssigned,
        groupsAssigned,
        outputsAssigned,
        frameworkVersionsMovedToReview,
    } = results;

    if (
        imageDescriptionsRetried ||
        imageDescriptionsAssigned ||
        groupsAssigned ||
        outputsAssigned ||
        frameworkVersionsMovedToReview
    ) {
        console.LogColor(
            console.color.FgCyan,
            `[frameworkCreationReconciler] ${JSON.stringify(results)}`
        );
    }
}

const tick = () => withLock(LOCK_KEY, LOCK_TTL_SECONDS, run);

module.exports = function start() {
    cron.schedule(SCHEDULE, tick, { timezone: 'UTC' });
    console.LogColor(console.color.FgGreen, `[frameworkCreationReconciler] scheduled (${SCHEDULE})`);
};
