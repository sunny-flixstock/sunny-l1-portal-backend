/**
 * Normalize S3 ETag values (strip quotes, trim).
 */
const normalizeEtag = (etag) => {
    if (etag == null || etag === '') {
        return null;
    }
    return String(etag).trim().replace(/^"+|"+$/g, '');
};

module.exports = { normalizeEtag };
