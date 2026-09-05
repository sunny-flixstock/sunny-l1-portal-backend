const path = require('path');
const fs = require('fs').promises;
const Api400Error = require('../errors/api400Error');

const API_DOCS_DIR = path.resolve(__dirname, '..', 'API_DOCS');
const ALLOWED_EXTENSIONS = new Set(['.html', '.md']);

const isAllowedFilename = (name) => {
    if (!name || typeof name !== 'string') {
        return false;
    }

    const trimmed = name.trim();
    if (!trimmed || trimmed !== name) {
        return false;
    }

    if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
        return false;
    }

    return ALLOWED_EXTENSIONS.has(path.extname(trimmed).toLowerCase());
};

const resolveDocPath = (name) => {
    if (!isAllowedFilename(name)) {
        throw new Api400Error('Invalid document name');
    }

    const filePath = path.resolve(API_DOCS_DIR, name);
    if (!filePath.startsWith(`${API_DOCS_DIR}${path.sep}`) && filePath !== API_DOCS_DIR) {
        throw new Api400Error('Invalid document name');
    }

    return filePath;
};

const formatFromExtension = (extension) => (extension === '.md' ? 'markdown' : 'html');

const displayTitle = (filename) => {
    const base = path.basename(filename, path.extname(filename));
    return base
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const listApiDocs = async () => {
    const entries = await fs.readdir(API_DOCS_DIR, { withFileTypes: true });
    const docs = [];

    for (const entry of entries) {
        if (!entry.isFile() || !isAllowedFilename(entry.name)) {
            continue;
        }

        const stat = await fs.stat(path.join(API_DOCS_DIR, entry.name));
        const extension = path.extname(entry.name).toLowerCase();

        docs.push({
            name: entry.name,
            format: formatFromExtension(extension),
            title: displayTitle(entry.name),
            updatedAt: stat.mtime.toISOString(),
        });
    }

    docs.sort((left, right) => left.title.localeCompare(right.title));

    return { data: docs };
};

const getApiDoc = async (name) => {
    const filePath = resolveDocPath(name);

    let content;
    try {
        content = await fs.readFile(filePath, 'utf8');
    } catch (err) {
        if (err?.code === 'ENOENT') {
            throw new Api400Error(`API document not found: ${name}`);
        }
        throw err;
    }

    const extension = path.extname(name).toLowerCase();

    return {
        data: {
            name,
            format: formatFromExtension(extension),
            title: displayTitle(name),
            content,
        },
    };
};

module.exports = {
    listApiDocs,
    getApiDoc,
};
