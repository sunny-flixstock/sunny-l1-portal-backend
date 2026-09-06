const jwt = require('jsonwebtoken');
const { PORTAL_PASSWORD, SESSION_JWT_SECRET } = require('../config');
const Api400Error = require('../errors/api400Error');

const SESSION_TTL = '30d';

// This portal has exactly one intended user, gated by a single shared
// password (PORTAL_PASSWORD) rather than a per-account identity provider --
// deliberately simple, since the only requirement is "only I can open this
// link," not per-user auditing.
const postLogin = async (req, res, next) => {
    try {
        const { password } = req.body;
        if (!password) {
            throw new Api400Error('password is required');
        }
        if (!PORTAL_PASSWORD || !SESSION_JWT_SECRET) {
            throw new Api400Error(
                'Server is not configured for login -- PORTAL_PASSWORD / SESSION_JWT_SECRET missing',
                'Server Misconfigured',
                500
            );
        }

        if (password !== PORTAL_PASSWORD) {
            return res.status(403).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ sub: 'portal-owner' }, SESSION_JWT_SECRET, { expiresIn: SESSION_TTL });
        return res.status(200).json({ data: { token } });
    } catch (err) {
        next(err);
    }
};

const getMe = async (req, res) => {
    res.status(200).json({ data: { authenticated: Boolean(req.user) } });
};

module.exports = { postLogin, getMe };
