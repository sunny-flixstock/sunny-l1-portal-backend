const { getFrameworkForPartner } = require('../services/partnerFramework.service');

const getPartnerFramework = async (req, res, next) => {
    try {
        const result = await getFrameworkForPartner(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPartnerFramework,
};
