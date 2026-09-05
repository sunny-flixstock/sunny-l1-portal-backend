const jwt = require('jsonwebtoken');
const { SESSION_JWT_SECRET } = require('../config');

// Paths that must stay reachable with no session at all -- the health
// check (so the platform's own uptime probe doesn't need a token) and the
// login endpoint itself (there's no session yet to attach). Everything
// else on /api/v1, across every route group, requires a valid session --
// this app is a single-user personal portal now, not a shared local tool,
// so nothing gets the old "local/dev convenience, no auth" carve-out.
const EXEMPT_PATHS = new Set(['/healthcheck', '/auth/google']);

const sessionAuth = (req, res, next) => {
    if (EXEMPT_PATHS.has(req.path)) {
        return next();
    }

    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        req.user = jwt.verify(token, SESSION_JWT_SECRET);
        return next();
    } catch {
        return res.status(401).json({ message: 'Session expired or invalid' });
    }
};

module.exports = { sessionAuth };
