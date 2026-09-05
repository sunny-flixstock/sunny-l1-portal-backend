const pgvector = require('pgvector/pg');
const { getPool } = require('../../startup/pgvector');

const TABLE = 'description_model_image_embeddings';

const upsert = async ({ docId, modelIdentity, embedding }) => {
    const pool = getPool();
    await pool.query(
        `INSERT INTO ${TABLE} (doc_id, model_identity, embedding)
         VALUES ($1, $2, $3)
         ON CONFLICT (doc_id) DO UPDATE SET
            model_identity = EXCLUDED.model_identity,
            embedding      = EXCLUDED.embedding,
            updated_at     = NOW()`,
        [docId, modelIdentity, pgvector.toSql(embedding)]
    );
};

const searchByEmbedding = async ({ embedding, modelIdentities = [], skip = 0, limit = 20 }) => {
    const pool = getPool();

    // Build filter independently for page and count queries
    const filterConditions = [];
    const filterParams = [];
    if (modelIdentities.length) {
        filterParams.push(modelIdentities);
        filterConditions.push(`model_identity = ANY($${filterParams.length})`);
    }
    const whereClause = filterConditions.length ? `WHERE ${filterConditions.join(' AND ')}` : '';

    // Page query: embedding is always $1, filter params shift by 1
    const pageParams = [pgvector.toSql(embedding)];
    const shiftedWhere = whereClause.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 1}`);
    filterParams.forEach((p) => pageParams.push(p));
    pageParams.push(limit, skip);
    const limitPh = `$${pageParams.length - 1}`;
    const offsetPh = `$${pageParams.length}`;

    const pageSQL = `
        SELECT doc_id, model_identity, 1 - (embedding <=> $1::vector) AS similarity
        FROM ${TABLE}
        ${shiftedWhere}
        ORDER BY embedding <=> $1::vector
        LIMIT ${limitPh} OFFSET ${offsetPh}`;

    const countSQL = `SELECT count(*)::int AS total FROM ${TABLE} ${whereClause}`;

    const [pageRes, countRes] = await Promise.all([
        pool.query(pageSQL, pageParams),
        pool.query(countSQL, filterParams),
    ]);

    return {
        hits: pageRes.rows.map((r) => ({
            docId: r.doc_id,
            modelIdentity: r.model_identity,
            similarity: parseFloat(r.similarity),
        })),
        total: countRes.rows[0].total,
    };
};

module.exports = { upsert, searchByEmbedding };
