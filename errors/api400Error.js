// Vendored from Flixstock/horcrux/error/api400Error.js, extended with optional { errors } payload
const BaseError = require('./baseError');

function isErrorOptionsObject(arg) {
    return (
        arg &&
        typeof arg === 'object' &&
        !Array.isArray(arg) &&
        Object.prototype.hasOwnProperty.call(arg, 'errors')
    );
}

class Api400Error extends BaseError {
    /**
     * @param {string} message
     * @param {string|object} [nameOrOptions] — Horcrux: name string; or `{ errors, name?, statusCode?, operationalError? }` for row validation
     * @param {number} [statusCode]
     * @param {boolean} [operationalError]
     */
    constructor(message, nameOrOptions = 'Bad Request', statusCode = 400, operationalError = true) {
        if (isErrorOptionsObject(nameOrOptions)) {
            const o = nameOrOptions;
            super(o.name ?? 'Bad Request', o.statusCode ?? 400, o.operationalError !== false, message);
            this.errors = o.errors;
        } else {
            super(nameOrOptions, statusCode, operationalError, message);
        }
    }
}

module.exports = Api400Error;
