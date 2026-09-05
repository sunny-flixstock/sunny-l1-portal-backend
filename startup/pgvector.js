const { Pool } = require('pg');
const pgvector = require('pgvector/pg');
const { PG_DATABASE_URL } = require('../config');

let pool = null;

const SETUP_SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS sku_embeddings (
    id            SERIAL PRIMARY KEY,
    sku_id        VARCHAR(24) NOT NULL UNIQUE,
    client_name   VARCHAR(255) NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    metadata      JSONB,
    embedding     vector(2000) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sku_embedding_hnsw
    ON sku_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_sku_client_active
    ON sku_embeddings (client_name, is_active);

ALTER TABLE sku_embeddings ADD COLUMN IF NOT EXISTS embedding_partner vector(2000);
ALTER TABLE sku_embeddings ADD COLUMN IF NOT EXISTS should_not_produce BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_sku_embedding_partner_hnsw
    ON sku_embeddings USING hnsw (embedding_partner vector_cosine_ops)
    WHERE embedding_partner IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sku_garment_category
    ON sku_embeddings ((lower(jsonb_extract_path_text(metadata, 'garmentCategorization', 'category'))) text_pattern_ops)
    WHERE metadata ? 'garmentCategorization';

CREATE TABLE IF NOT EXISTS description_model_image_embeddings (
    id             SERIAL PRIMARY KEY,
    doc_id         VARCHAR(24) NOT NULL UNIQUE,
    model_identity VARCHAR(255) NOT NULL,
    embedding      vector(512) NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dmi_embedding_hnsw
    ON description_model_image_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_dmi_model_identity
    ON description_model_image_embeddings (model_identity);
`;

const initPgVector = async () => {
    if (!PG_DATABASE_URL) throw new Error('PG_DATABASE_URL is required');
    pool = new Pool({ connectionString: PG_DATABASE_URL });

    pool.on('connect', async (client) => {
        await pgvector.registerTypes(client);
        // Raise HNSW candidate scan so deep semantic-search pages return results under selective filters.
        await client.query('SET hnsw.ef_search = 1000');
    });

    const client = await pool.connect();
    try {
        await client.query(SETUP_SQL);
        console.LogColor(console.color.FgGreen, 'pgVector initialized successfully');
    } finally {
        client.release();
    }
};

const getPool = () => {
    if (!pool) throw new Error('pgVector pool not initialized. Call initPgVector() first.');
    return pool;
};

const start = async () => {
    try {
        await initPgVector();
    } catch (err) {
        console.LogColor(console.color.FgYellow, `pgVector init failed (semantic search will be unavailable): ${err.message}`);
    }
};

module.exports = start;
module.exports.initPgVector = initPgVector;
module.exports.getPool = getPool;
