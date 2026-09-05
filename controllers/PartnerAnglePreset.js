const { listAnglePresetsForPartner } = require('../services/partnerAnglePreset.service');

const getPartnerAnglePresets = async (req, res, next) => {
    try {
        const result = await listAnglePresetsForPartner(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPartnerAnglePresets,
};
