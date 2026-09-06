const multer = require('multer');

// In-memory only, extracted and discarded within the request -- see
// controllers/L1GenericFeedback.js's postGenericFeedbackZip for why this
// deviates from the project's usual pre-signed-S3-upload convention.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 60 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const isZip = file.mimetype === 'application/zip' || file.originalname.toLowerCase().endsWith('.zip');
        if (isZip) {
            cb(null, true);
        } else {
            cb(new Error('Only .zip files are accepted'));
        }
    },
});

module.exports = upload;
