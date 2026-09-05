const { loadInstruction } = require('../loadInstruction');

const systemInstruction = loadInstruction(__dirname, 'garmentAnalyst.md');

module.exports = { systemInstruction };
