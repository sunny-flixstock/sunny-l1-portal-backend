const slugifyAngleSegment = (value) =>
    String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

const buildBaseAngleSeriesKey = (name) => {
    const slug = slugifyAngleSegment(name);
    if (!slug) {
        throw new Error('Angle name must contain at least one alphanumeric character');
    }
    return slug;
};

const buildClientAngleSeriesKey = (client, baseAngleSeriesKey, name) => {
    const clientSlug = slugifyAngleSegment(client);
    const baseSlug = slugifyAngleSegment(baseAngleSeriesKey);
    const nameSlug = slugifyAngleSegment(name);
    if (!clientSlug || !baseSlug || !nameSlug) {
        throw new Error('Client, base angle series key, and name are required');
    }
    return `${clientSlug}/${baseSlug}/${nameSlug}`;
};

module.exports = {
    slugifyAngleSegment,
    buildBaseAngleSeriesKey,
    buildClientAngleSeriesKey,
};
