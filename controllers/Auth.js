const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { GOOGLE_CLIENT_ID, ALLOWED_LOGIN_EMAIL, SESSION_JWT_SECRET } = require('../config');
const Api400Error = require('../errors/api400Error');

const SESSION_TTL = '30d';

let cachedClient = null;
const getGoogleClient = () => {
    if (!cachedClient) {
        cachedClient = new OAuth2Client(GOOGLE_CLIENT_ID);
    }
    return cachedClient;
};

// This portal has exactly one intended user -- login succeeds only for the
// one email configured via ALLOWED_LOGIN_EMAIL, everyone else's (otherwise
// perfectly valid) Google account is rejected.
const postGoogleLogin = async (req, res, next) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            throw new Api400Error('credential is required');
        }
        if (!GOOGLE_CLIENT_ID || !ALLOWED_LOGIN_EMAIL || !SESSION_JWT_SECRET) {
            throw new Api400Error(
                'Server is not configured for login -- GOOGLE_CLIENT_ID / ALLOWED_LOGIN_EMAIL / SESSION_JWT_SECRET missing',
                'Server Misconfigured',
                500
            );
        }

        const ticket = await getGoogleClient().verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();

        const email = String(payload?.email ?? '').toLowerCase().trim();
        const allowed = String(ALLOWED_LOGIN_EMAIL).toLowerCase().trim();

        if (!payload?.email_verified || email !== allowed) {
            return res.status(403).json({ message: 'This account is not authorized to access this portal' });
        }

        const token = jwt.sign({ email }, SESSION_JWT_SECRET, { expiresIn: SESSION_TTL });
        return res.status(200).json({ data: { token, email } });
    } catch (err) {
        next(err);
    }
};

const getMe = async (req, res) => {
    res.status(200).json({ data: { email: req.user?.email ?? null } });
};

module.exports = { postGoogleLogin, getMe };
