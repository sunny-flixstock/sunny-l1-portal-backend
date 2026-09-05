const { addModel } = require('../startup/db');
const mongoose = require('mongoose');

const MAX_FILTER_VALUES = 200;

const FilterSchema = new mongoose.Schema(
    {
        clientName: { type: String, required: true, trim: true },
        key:        { type: String, required: true, trim: true },
        values:     { type: [String], default: [] },
        isDynamic:  { type: Boolean, default: false },
    },
    { timestamps: true }
);

FilterSchema.index({ clientName: 1, key: 1 }, { unique: true });

FilterSchema.statics.addValue = function (clientName, key, value) {
    const v = String(value);
    return this.collection.updateOne(
        { clientName, key },
        [
            {
                $set: {
                    clientName,
                    key,
                    isDynamic: {
                        $cond: [
                            { $eq: ['$isDynamic', true] },
                            true,
                            { $gte: [{ $size: { $ifNull: ['$values', []] } }, MAX_FILTER_VALUES] },
                        ],
                    },
                    values: {
                        $cond: [
                            { $eq: ['$isDynamic', true] },
                            [],
                            {
                                $cond: [
                                    { $gte: [{ $size: { $ifNull: ['$values', []] } }, MAX_FILTER_VALUES] },
                                    [],
                                    { $setUnion: [{ $ifNull: ['$values', []] }, [v]] },
                                ],
                            },
                        ],
                    },
                },
            },
        ],
        { upsert: true }
    );
};

FilterSchema.statics.getForClient = function (clientName) {
    return this.find(
        { clientName },
        { key: 1, values: 1, isDynamic: 1, _id: 0 }
    ).lean();
};

const FilterModel = addModel('filter', FilterSchema, 'Filter');

module.exports = FilterModel;
module.exports.MAX_FILTER_VALUES = MAX_FILTER_VALUES;
