const { PARTNER_API_KEYS } = require('../config');

const apiKeyAuth = (req, res, next) => {
    const provided = req.get('x-api-key');
    if (!provided || !PARTNER_API_KEYS.includes(provided)) {
        return res.status(401).json({ message: 'Invalid or missing API key' });
    }
    next();
};

module.exports = { apiKeyAuth };
