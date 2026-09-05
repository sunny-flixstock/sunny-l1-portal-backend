const router = require('express').Router();
const { postGoogleLogin, getMe } = require('../controllers/Auth');
const authValidation = require('../validations/auth.validation');

// Public -- no session exists yet at login time. Exempted by path in
// middlewares/sessionAuth.js.
router.post('/google', authValidation.postGoogleLogin, postGoogleLogin);

// Requires a valid session (not exempt) -- lets the frontend confirm a
// stored token is still good on app load.
router.get('/me', getMe);

module.exports = router;
