const os = require('os');
const CronLock = require('../models/CronLock.model');

const acquireLock = async (key, ttlSeconds) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    const holder = `${os.hostname()}:${process.pid}`;
    try {
        await CronLock.findOneAndUpdate(
            { key, $or: [{ expiresAt: { $lte: now } }, { expiresAt: { $exists: false } }] },
            { $set: { key, holder, expiresAt } },
            { upsert: true, new: false }
        );
        return true;
    } catch (err) {
        if (err.code === 11000) return false;
        return null;
    }
};

const releaseLock = async (key) => {
    const holder = `${os.hostname()}:${process.pid}`;
    try {
        // delete only if we still own the lock (TTL hasn't auto-expired and re-issued it to someone else)
        await CronLock.deleteOne({ key, holder });
    } catch (_) { /* best-effort */ }
};

const withLock = async (key, ttlSeconds, fn) => {
    let gotLock = false;
    try {
        gotLock = await acquireLock(key, ttlSeconds);
    } catch (err) {
        console.LogColor(console.color.FgYellow, `[${key}] lock error, running anyway: ${err.message}`);
        gotLock = null;
    }
    if (gotLock === false) return;
    try {
        await fn();
    } catch (err) {
        console.LogColor(console.color.FgRed, `[${key}] tick error: ${err.message}`);
    } finally {
        if (gotLock === true) await releaseLock(key);
    }
};

module.exports = { acquireLock, releaseLock, withLock };
