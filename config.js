const process = require('process');
require('dotenv').config();

module.exports = {
    PORT: process.env.PORT,
    CONN_MONGO: process.env.DB_CONNECTION_STRING,
    MONGO_USER: process.env.DB_USER,
    MONGO_PASSWORD: process.env.DB_PASSWORD,
    S3_BUCKET: process.env.s3Bucket,
    PROMPT_S3_BUCKET: process.env.promptS3Bucket || process.env.s3Bucket,
    S3_REGION: process.env.s3Region,
    AWS_ACCESS_KEY: process.env.s3AccessKey,
    AWS_SECRET_KEY: process.env.s3SecretKey,
    slackBot: { botToken: process.env.slackBotToken, channelName: 'pegasus-errors' },
    thumbnailSize: {
        width: 600,
        height: 900,
    },
    PG_DATABASE_URL: process.env.PG_DATABASE_URL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_VISION_MODEL: "gemini-3.5-flash-lite",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    CUSTOM_LLM_BASE_URL: process.env.CUSTOM_LLM_BASE_URL,
    CUSTOM_LLM_API_KEY: process.env.CUSTOM_LLM_API_KEY,
    EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || 'gemini',
    INTERNAL_CLIENT_NAME: 'FLIXSTOCK',
    INTERNAL_ASSETS_BUCKET: 'fxgati',
    INTERNAL_ASSETS_KEY_PREFIX: 'aiStyling/InternalAssets',
    PARTNER_API_KEYS: (process.env.PARTNER_API_KEYS || '').split(',').map((s) => s.trim()).filter(Boolean),
    PORTAL_PASSWORD: process.env.PORTAL_PASSWORD,
    SESSION_JWT_SECRET: process.env.SESSION_JWT_SECRET,
    FIXED_THUMB_BUCKET: "flixstudio",
    DESCRIPTION_GROUP_BATCH_SIZE: Number(process.env.DESCRIPTION_GROUP_BATCH_SIZE) || 50,
    // Self-hosted Arize Phoenix telemetry server -- source for the
    // one-click BZT Sports auto-run's rework detection (phoenixFeedback.service.js).
    PHOENIX_BASE_URL: process.env.PHOENIX_BASE_URL || 'http://192.168.12.115:6007',
    // Bucket holding nanostudio's per-execution artifacts (prompts/output
    // images) that phoenixFeedback.service.js reads via getFileFromS3 --
    // distinct from this app's own S3_BUCKET. Uses the same AWS_ACCESS_KEY/
    // AWS_SECRET_KEY above; permission against this specific bucket is
    // unverified, see the plan's Risks section.
    NANOSTUDIO_ARTIFACTS_BUCKET: process.env.NANOSTUDIO_ARTIFACTS_BUCKET || 'ai-log-tracking',
};
