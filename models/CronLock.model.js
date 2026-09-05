const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const CronLockSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        holder: { type: String, required: true },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

CronLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = addModel('cronLock', CronLockSchema, 'cronLocks');
