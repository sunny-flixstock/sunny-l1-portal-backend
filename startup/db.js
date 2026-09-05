require('../utils/ColorLogger')();
const mongoose = require('mongoose');
const { CONN_MONGO, MONGO_USER, MONGO_PASSWORD } = require('../config');
const db = CONN_MONGO;
const options = {
    user: MONGO_USER,
    pass: MONGO_PASSWORD,
    authSource: 'admin',
    ssl: false,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 5000,
    family: 4,
};

let conn = null;

const initDB = async function () {
    if (conn == null) {
        conn = mongoose.createConnection(db, options);
        conn.on('error', error => {
            console.log('error connecting to db', { error });
            conn = null;
        });
        console.LogColor(console.color.FgMagenta, 'Connected to database');
    }
};

const addModel = (schemaName, schema, alias) => {
    if (conn == null) {
        initDB();
    }
    return conn.model(schemaName, schema, alias);
};

const createSessionDB = () => {
    if (conn == null) {
        initDB();
    }
    const session = conn.startSession();
    return session;
};


const WrapInTransaction = async function (callback) {
    let session = null;
    try {
        session = await createSessionDB();
        const transactionOptions = {
            readPreference: 'primary',
            readConcern: { level: 'local' },
            writeConcern: { w: 'majority' },
        };

        let value = null;

        await session.withTransaction(async () => {
            value = await callback(session);
        }, transactionOptions);
        return value;
    } catch (error) {
        console.log('Error from wrap in transaction: ', error);
        throw error;
    } finally {
        await session.endSession();
    }
};

exports.addModel = addModel;
exports.createSessionDB = createSessionDB;
exports.WrapInTransaction = WrapInTransaction;
exports.initDB = initDB;

module.exports = exports;
