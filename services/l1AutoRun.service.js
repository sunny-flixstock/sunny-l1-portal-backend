const { createPayloadSessionFromPhoenix } = require('./l1PayloadSession.service');
const { buildFeedbackDeckPptx } = require('./l1FeedbackDeck.service');
const { sendFeedbackDeckEmail } = require('./mailer.service');
const { createBatchAndProcess } = require('./l1FeedbackBatch.service');
const L1PayloadFileModel = require('../models/L1PayloadFile.model');

const DEFAULT_TO = 'ashish@flixstock.com';
const DEFAULT_CC = 'viren@flixstock.com';

/** One-click BZT Sports pipeline: fetch the window's reworked SKUs from
 * Phoenix -> build a Payload Creation session -> generate + email the
 * feedback deck (via Gmail/Workspace SMTP, not AWS SES -- see
 * mailer.service.js) -> hand the same session's configs straight to the
 * existing, unmodified SKU-RCA -> batch-RCA -> reconcile pipeline. Mirrors
 * createBatchAndProcess's own pattern: returns as soon as the deck is sent
 * and the batch is created, RCA continues in the background -- poll
 * GET /l1-feedback/batches/:batchId exactly as today. */
const runBztSportsAutoBatch = async ({ windowHours, startTime, endTime, createdBy }) => {
    const resolvedEndTime = endTime || new Date().toISOString();
    const resolvedStartTime = startTime || new Date(Date.now() - (windowHours || 24) * 60 * 60 * 1000).toISOString();

    const session = await createPayloadSessionFromPhoenix({
        startTime: resolvedStartTime,
        endTime: resolvedEndTime,
        createdBy,
    });

    const files = await L1PayloadFileModel.find({ sessionId: session._id }).lean();
    if (!files.length) {
        return {
            sessionId: session._id,
            batchId: null,
            deckEmailed: false,
            message: `No BZT Sports SKUs flagged for rework between ${resolvedStartTime} and ${resolvedEndTime}.`,
        };
    }

    const { buffer, filename } = await buildFeedbackDeckPptx(session._id);

    let deckEmailed = false;
    let emailError = null;
    try {
        await sendFeedbackDeckEmail({
            to: DEFAULT_TO,
            cc: DEFAULT_CC,
            subject: `BZT Sports feedback deck — ${session.date}`,
            buffer,
            filename,
        });
        deckEmailed = true;
    } catch (err) {
        // Email failure (e.g. SMTP not yet configured) should never block
        // RCA from running -- surfaced to the caller instead so a human can
        // resend the deck separately via the existing download route.
        emailError = err.message;
    }

    const configs = files.map((file) => ({ skuId: file.skuId, config: JSON.parse(file.content).configData[file.skuId] }));
    const batch = await createBatchAndProcess({ configs, createdBy });

    return {
        sessionId: session._id,
        batchId: batch._id,
        deckEmailed,
        emailError,
        skuCount: files.length,
    };
};

module.exports = {
    runBztSportsAutoBatch,
};
