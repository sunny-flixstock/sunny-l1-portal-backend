module.exports = key => {
    const specialChars = /[!'()*]/g;
    const percentEncode = match => '%' + match[0].charCodeAt(0).toString(16).toUpperCase();
    return encodeURIComponent(key).replace(specialChars, percentEncode);
};
