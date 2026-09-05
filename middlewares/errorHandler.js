const errorHandler = (err, req, res, next) => {
    if (err?.details && typeof err.details.get === 'function') {
        res.status(400).json({ message: validationResponse(err) });
    } else {
        const statusCode = err.statusCode || 500;
        const body = { message: err.message || err };
        if (err.errors !== undefined) {
            body.errors = err.errors;
        }
        res.status(statusCode).json(body);
    }
};

function validationResponse(err) {
    const errorBody = err.details.get('body');
    const errorQuery = err.details.get('query');
    const errorParams = err.details.get('params');

    return {
        params: errorParams && errorParams.details && errorParams.details.map(returnErrorString),
        query: errorQuery && errorQuery.details && errorQuery.details.map(returnErrorString),
        body: errorBody && errorBody.details && errorBody.details.map(returnErrorString),
    };
}

function returnErrorString(detail) {
    return detail.message || '';
}

module.exports = Object.freeze({
    errorHandler,
});
