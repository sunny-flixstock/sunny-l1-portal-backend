const pgvector = require('pgvector/pg');
const { getPool } = require('../startup/pgvector');
const { EXCLUDE_DAR_SCAN_SHOOT_TYPE_SQL } = require('../utils/filterValues');

const upsert = async ({ skuId, embedding, embeddingPartner, clientName, isActive, shouldNotProduce = false, metadata }) => {
    const pool = getPool();
    const partnerSql = embeddingPartner ? pgvector.toSql(embeddingPartner) : null;
    await pool.query(
        `INSERT INTO sku_embeddings (sku_id, client_name, is_active, should_not_produce, metadata, embedding, embedding_partner)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (sku_id) DO UPDATE SET
            client_name = EXCLUDED.client_name,
            is_active = EXCLUDED.is_active,
            should_not_produce = EXCLUDED.should_not_produce,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding,
            embedding_partner = COALESCE(EXCLUDED.embedding_partner, sku_embeddings.embedding_partner),
            updated_at = NOW()`,
        [skuId, clientName, isActive, shouldNotProduce, JSON.stringify(metadata), pgvector.toSql(embedding), partnerSql]
    );
};

const updateMetadata = async ({ skuId, metadata }) => {
    const pool = getPool();
    await pool.query(
        `UPDATE sku_embeddings SET metadata = $1, updated_at = NOW() WHERE sku_id = $2`,
        [JSON.stringify(metadata), skuId]
    );
};

const VECTOR_COLUMNS = new Set(['embedding', 'embedding_partner']);

const appendCondition = (whereClause, cond) =>
    whereClause ? `${whereClause} AND ${cond}` : `WHERE ${cond}`;

const SEMANTIC_SEARCH_CAP = 1000;

const searchByEmbedding = async ({ embedding, whereClause = '', whereParams = [], skip = 0, limit = 20, column = 'embedding' }) => {
    const pool = getPool();
    const vecCol = VECTOR_COLUMNS.has(column) ? column : 'embedding';

    let pageSQL;
    let countSQL;
    let pageParams;
    let mapHit;
    const filteredWhere = appendCondition(whereClause, EXCLUDE_DAR_SCAN_SHOOT_TYPE_SQL);

    if (embedding) {
        const vecParam = pgvector.toSql(embedding);
        pageParams = [vecParam, ...whereParams, limit, skip];
        const limitPh = `$${pageParams.length - 1}`;
        const offsetPh = `$${pageParams.length}`;
        const shiftedWhere = filteredWhere.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + 1}`);
        const notNullCond = `${vecCol} IS NOT NULL`;
        pageSQL = `SELECT sku_id, 1 - (${vecCol} <=> $1::vector) AS similarity
                   FROM sku_embeddings ${appendCondition(shiftedWhere, notNullCond)}
                   ORDER BY ${vecCol} <=> $1::vector
                   LIMIT ${limitPh} OFFSET ${offsetPh}`;
        countSQL = `SELECT count(*)::int AS total FROM sku_embeddings ${appendCondition(filteredWhere, notNullCond)}`;
        mapHit = (r) => ({ skuId: r.sku_id, similarity: parseFloat(r.similarity) });
    } else {
        pageParams = [...whereParams, limit, skip];
        const limitPh = `$${pageParams.length - 1}`;
        const offsetPh = `$${pageParams.length}`;
        pageSQL = `SELECT sku_id FROM sku_embeddings ${filteredWhere}
                   ORDER BY updated_at DESC
                   LIMIT ${limitPh} OFFSET ${offsetPh}`;
        countSQL = `SELECT count(*)::int AS total FROM sku_embeddings ${filteredWhere}`;
        mapHit = (r) => ({ skuId: r.sku_id, similarity: null });
    }

    const [pageRes, countRes] = await Promise.all([
        pool.query(pageSQL, pageParams),
        pool.query(countSQL, whereParams),
    ]);

    const actualTotal = countRes.rows[0].total;
    return {
        hits: pageRes.rows.map(mapHit),
        total: embedding ? Math.min(actualTotal, SEMANTIC_SEARCH_CAP) : actualTotal,
        actualTotal,
    };
};

const setShouldNotProduce = async ({ skuId, shouldNotProduce }) => {
    const pool = getPool();
    const res = await pool.query(
        `UPDATE sku_embeddings SET should_not_produce = $1, updated_at = NOW() WHERE sku_id = $2`,
        [shouldNotProduce, skuId]
    );
    return res.rowCount;
};

module.exports = { upsert, updateMetadata, searchByEmbedding, setShouldNotProduce };
