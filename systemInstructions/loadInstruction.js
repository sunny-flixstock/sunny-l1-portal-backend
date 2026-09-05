const fs = require('fs');
const path = require('path');

const loadInstruction = (dir, fileName) =>
    fs.readFileSync(path.join(dir, fileName), 'utf8');

module.exports = { loadInstruction };
