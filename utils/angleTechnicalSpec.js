const stableStringify = require('json-stable-stringify');
const { GetMD5Hash } = require('./crypto');

const COLOR_MODES = Object.freeze(['rgb', 'srgb', 'cmyk', 'grayscale']);
const FILE_FORMATS = Object.freeze(['jpg', 'jpeg', 'png', 'webp', 'tiff']);
const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';

const buildSpecPayload = ({
    dimensions,
    background,
    fileSpecifications,
}) => ({
    dimensions: {
        width: dimensions.width,
        height: dimensions.height,
        dpi: dimensions.dpi,
    },
    background: {
        color: background?.color ?? DEFAULT_BACKGROUND_COLOR,
    },
    fileSpecifications: {
        colorMode: fileSpecifications.colorMode,
        fileFormat: fileSpecifications.fileFormat,
    },
});

const computeSpecHash = async (specPayload) => {
    const canonical = stableStringify(specPayload);
    return GetMD5Hash(canonical);
};

module.exports = {
    COLOR_MODES,
    FILE_FORMATS,
    DEFAULT_BACKGROUND_COLOR,
    buildSpecPayload,
    computeSpecHash,
};
