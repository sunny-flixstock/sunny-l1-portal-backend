const { router } = require('../routes');
const { errorHandler } = require('../middlewares/errorHandler');
const { sessionAuth } = require('../middlewares/sessionAuth');
const { errors: celebrateErrors } = require('celebrate');
const cors = require('cors');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json({ limit: '50mb' });

module.exports = async function init(app) {
    const publicCorsOptions = {
        origin: '*',
        methods: ['POST', 'PUT', 'GET', 'OPTIONS', 'HEAD', 'DELETE', 'PATCH'],
        exposedHeaders: 'Content-Disposition',
    };
    app.use('/api/v1', jsonParser, cors(publicCorsOptions), sessionAuth, router, celebrateErrors(), errorHandler);
    console.LogColor(console.color.FgBlue, 'Router Initialized');
};
