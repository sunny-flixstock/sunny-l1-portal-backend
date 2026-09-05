const { getDigitalizedFundusReport } = require('../services/customReport.service');

const digitalizedFundus = async (req, res, next) => {
    try {
        const result = await getDigitalizedFundusReport(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = { digitalizedFundus };
