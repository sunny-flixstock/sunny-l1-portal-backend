const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const RetryQueueSchema = new mongoose.Schema(
    {
        queueType: { type: String, enum: ['thumbnailRetry'] },
        data: Object,
        failureReason: String,
        retryAttempts: { type: Number, default: 0 },
        additionalData: Object,
    },
    {
        timestamps: {
            createdAt: true,
            updatedAt: true,
        },
    }
);

const RetryQueueModel = addModel('retryQueue', RetryQueueSchema, 'RetryQueue');

module.exports = RetryQueueModel;
