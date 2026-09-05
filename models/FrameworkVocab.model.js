const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const FrameworkVocabSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        vocab: { type: mongoose.Schema.Types.Mixed, required: true },
        contentHash: { type: String, required: true, trim: true },
    },
    { timestamps: true }
);

FrameworkVocabSchema.index({ contentHash: 1 });
FrameworkVocabSchema.index({ createdAt: -1 });
FrameworkVocabSchema.index({ name: 1 });

const FrameworkVocabModel = addModel('frameworkVocab', FrameworkVocabSchema, 'FrameworkVocab');

module.exports = FrameworkVocabModel;
