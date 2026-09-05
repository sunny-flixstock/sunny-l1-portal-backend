const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

// The 4 gendered core files + 4 ungendered angle files per client.
const L1_GROUND_TRUTH_DOC_KEYS = Object.freeze([
    'styling',
    'posing',
    'FULL_FRONT',
    'FRONT_UPPER_CROP',
    'FULL_BACK',
    'FRONT_LOWER_CROP',
]);

const L1GroundTruthDocumentSchema = new mongoose.Schema(
    {
        client: { type: String, required: true, trim: true },
        gender: { type: String, enum: ['male', 'female', null], default: null },
        docKey: { type: String, enum: L1_GROUND_TRUTH_DOC_KEYS, required: true },
        fileName: { type: String, required: true, trim: true },
        stagingVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1GroundTruthVersion', default: null },
        liveVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1GroundTruthVersion', default: null },
    },
    { timestamps: true }
);

L1GroundTruthDocumentSchema.index({ client: 1, gender: 1, docKey: 1 }, { unique: true });

const L1GroundTruthDocumentModel = addModel(
    'l1GroundTruthDocument',
    L1GroundTruthDocumentSchema,
    'L1GroundTruthDocument'
);

module.exports = L1GroundTruthDocumentModel;
module.exports.L1_GROUND_TRUTH_DOC_KEYS = L1_GROUND_TRUTH_DOC_KEYS;
