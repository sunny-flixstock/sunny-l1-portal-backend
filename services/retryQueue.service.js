const RetryQueueModel = require('../models/RetryQueue.model');
const { InitializeThumbnailGeneration } = require('../utils/lambda');

const MAX_RETRY_ATTEMPTS = 3;

const retryThumbnails = async () => {
    const entries = await RetryQueueModel.find({
        queueType: 'thumbnailRetry',
        retryAttempts: { $lt: MAX_RETRY_ATTEMPTS },
    }).limit(50);

    const results = { success: 0, failed: 0, removed: 0 };
    const CONCURRENCY = 10;

    for (let i = 0; i < entries.length; i += CONCURRENCY) {
        const batch = entries.slice(i, i + CONCURRENCY);
        await Promise.allSettled(
            batch.map(async (entry) => {
                try {
                    await InitializeThumbnailGeneration(entry.data, entry.additionalData, false);
                    await RetryQueueModel.deleteOne({ _id: entry._id });
                    results.success++;
                } catch (err) {
                    entry.retryAttempts += 1;
                    entry.failureReason = err.message || String(err);
                    if (entry.retryAttempts >= MAX_RETRY_ATTEMPTS) {
                        await RetryQueueModel.deleteOne({ _id: entry._id });
                        results.removed++;
                    } else {
                        await entry.save();
                        results.failed++;
                    }
                }
            })
        );
    }

    return results;
};

module.exports = { retryThumbnails };
