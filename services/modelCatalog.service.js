const {
    DESCRIPTION_PROVIDER_OPTIONS,
    DESCRIPTION_MODEL_CATALOG,
} = require('../model.catalog');

const getDescriptionModelCatalog = () => ({
    providers: DESCRIPTION_PROVIDER_OPTIONS,
    catalog: DESCRIPTION_MODEL_CATALOG,
});

module.exports = {
    getDescriptionModelCatalog,
};
