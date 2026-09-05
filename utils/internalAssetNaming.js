const formatSkuBarcode = (clientName, skuSeq) =>
    `FXS01${clientName}1C${String(skuSeq).padStart(3, '0')}`;

const formatAssetFileName = (barcode, assetSeq, ext) => {
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    return `${barcode}_${String(assetSeq).padStart(3, '0')}${normalizedExt}`;
};

module.exports = { formatSkuBarcode, formatAssetFileName };
