const router = require('express').Router();
const { retryThumbnails } = require('../services/retryQueue.service');
const { generateForAllMissing } = require('../services/skuImageDescription.service');
const { reindex } = require('../services/semanticSearch.service');

router.post('/retryThumbnails', async (req, res, next) => {
    try {
        const results = await retryThumbnails();
        return res.status(200).json(results);
    } catch (err) {
        next(err);
    }
});

router.post('/generateSkuDescriptions', (req, res) => {
    const { clientName } = req.body || {};
    res.status(202).json({ accepted: true, clientName: clientName || null, startedAt: new Date().toISOString() });
    setImmediate(() => {
        generateForAllMissing({ clientName })
            .then((result) => console.LogColor(console.color.FgGreen, `[generateSkuDescriptions] done ${JSON.stringify(result)}`))
            .catch((err) => console.LogColor(console.color.FgRed, `[generateSkuDescriptions] failed: ${err.message}`));
    });
});

router.post('/reindexEmbeddings', async (req, res, next) => {
    try {
        const result = await reindex({ clientName: req.body?.clientName });
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
