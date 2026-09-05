const parseEnumListParam = (value) => {
    if (value == null || value === '') {
        return [];
    }

    return String(value)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
};

module.exports = { parseEnumListParam };
