const mongoose = require('mongoose');
const { addModel } = require('../startup/db');

/**
 * One document per parentSkuId -- the SKU's entire RCA feedback history,
 * carried forward forever (never replaced, only grown). `data` holds the
 * exact nested shape from L1_Feedback_Skill/rca_generic_schema.json's
 * `configData.<parentSkuId>` value (gender, genderPreamble, groundTruth,
 * outfit_assembly_output, updatedOutfitSelction, gtom_L1_output). It is
 * stored as Mixed rather than a strict sub-schema because the
 * RCA_Iteration_<N>/approvedFix chain nests to arbitrary depth with a key
 * name that depends on that depth -- see utils/l1TraceLib.js, which is the
 * only code that should read/write into the recursive parts of `data`.
 *
 * Per the agreed trimming rule: `data.gtom_L1_output[].variants[]` only
 * ever contains variants that have had feedback.text populated at least
 * once; an angle with none left is dropped entirely.
 * `outfit_assembly_output`/`updatedOutfitSelction` are never pruned.
 */
const L1SkuTraceSchema = new mongoose.Schema(
    {
        _id: { type: String, required: true }, // parentSkuId
        gender: { type: String, enum: ['male', 'female'], required: true },
        data: { type: mongoose.Schema.Types.Mixed, required: true },
        lastBatchId: { type: mongoose.Schema.Types.ObjectId, ref: 'l1FeedbackBatch' },
    },
    { timestamps: true, _id: false }
);

const L1SkuTraceModel = addModel('l1SkuTrace', L1SkuTraceSchema, 'L1SkuTrace');

module.exports = L1SkuTraceModel;
