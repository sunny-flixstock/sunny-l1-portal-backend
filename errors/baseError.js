// Vendored from Flixstock/horcrux/error/baseError.js
class BaseError extends Error {
    constructor(name, statusCode, operationalError, message) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
        this.description = message;
        this.operationError = operationalError;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = BaseError;
