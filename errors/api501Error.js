const BaseError = require('./baseError');

class Api501Error extends BaseError {
    constructor(message, name = 'Not Implemented', statusCode = 501, operationalError = true) {
        super(name, statusCode, operationalError, message);
    }
}

module.exports = Api501Error;
