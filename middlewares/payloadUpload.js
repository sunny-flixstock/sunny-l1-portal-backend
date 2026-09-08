const multer = require('multer');

// Same in-memory, deliberate exception to CLAUDE.md mandate #4 as
// zipUpload.js -- see that file's comment. Two fields: many raw
// <skuId>.json configs, plus one feedback pptx/docx.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 25 * 1024 * 1024, files: 200 },
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'documents') {
            const isJson = file.mimetype === 'application/json' || file.originalname.toLowerCase().endsWith('.json');
            return cb(isJson ? null : new Error('documents[] must be .json files'), isJson);
        }
        if (file.fieldname === 'feedbackDoc') {
            const lower = file.originalname.toLowerCase();
            const isDoc = lower.endsWith('.pptx') || lower.endsWith('.docx');
            return cb(isDoc ? null : new Error('feedbackDoc must be a .pptx or .docx file'), isDoc);
        }
        cb(new Error(`Unexpected field: ${file.fieldname}`), false);
    },
});

module.exports = upload.fields([
    { name: 'documents', maxCount: 200 },
    { name: 'feedbackDoc', maxCount: 1 },
]);
