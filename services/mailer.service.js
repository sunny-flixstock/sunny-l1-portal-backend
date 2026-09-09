const nodemailer = require('nodemailer');

// No email infrastructure existed anywhere in this repo before this file
// (confirmed by search -- only a Slack error-alert webhook exists).
// Deliberately NOT using AWS SES/Flixstock AWS infra per explicit
// instruction -- Gmail/Google Workspace SMTP is free and needs no signup
// beyond generating an App Password for sunny.raj@flixstock.com (Google
// Account -> Security -> App Passwords), put in SMTP_USER/SMTP_PASS below.
const DEFAULT_SMTP_HOST = 'smtp.gmail.com';
const DEFAULT_SMTP_PORT = 587;

let transporter = null;
const getTransporter = () => {
    if (transporter) return transporter;
    const { SMTP_USER, SMTP_PASS } = process.env;
    const host = process.env.SMTP_HOST || DEFAULT_SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || DEFAULT_SMTP_PORT);
    if (!SMTP_USER || !SMTP_PASS) {
        throw new Error(
            'SMTP is not configured -- set SMTP_USER (sunny.raj@flixstock.com) and SMTP_PASS (a Gmail/Workspace App Password) in the environment before sending mail.'
        );
    }
    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    return transporter;
};

/** Sends the feedback deck PPTX buffer as an email attachment. `from`
 * defaults to SMTP_USER (sunny.raj@flixstock.com) -- Gmail/Workspace
 * generally requires From to match the authenticated account anyway. */
const sendFeedbackDeckEmail = async ({ to, cc, subject, buffer, filename }) => {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    await getTransporter().sendMail({
        from,
        to,
        cc,
        subject,
        text: `Attached: ${filename}`,
        attachments: [
            {
                filename,
                content: buffer,
                contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            },
        ],
    });
};

module.exports = {
    sendFeedbackDeckEmail,
};
