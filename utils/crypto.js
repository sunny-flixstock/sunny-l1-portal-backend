const Crypto = require('crypto');

const GetMD5Hash = async function (data) {
    const hash = await Crypto.createHash('md5').update(data).digest('hex');
    return hash;
};

module.exports = {
    GetMD5Hash,
};
