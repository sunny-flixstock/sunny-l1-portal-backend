const {
    listInstructionTypes,
    listSystemInstructions,
    getSystemInstructionById,
    createSystemInstruction,
    updateSystemInstructionName,
    archiveSystemInstruction,
    getSystemInstructionMetadata,
    toLeanInstruction,
} = require('../services/systemInstruction.service');

const getInstructionTypes = async (req, res, next) => {
    try {
        const data = await listInstructionTypes();
        return res.status(200).json({ data });
    } catch (err) {
        next(err);
    }
};

const getSystemInstructionsMeta = async (req, res, next) => {
    try {
        return res.status(200).json({ data: getSystemInstructionMetadata() });
    } catch (err) {
        next(err);
    }
};

const getSystemInstructions = async (req, res, next) => {
    try {
        const result = await listSystemInstructions(req.query);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
};

const getSystemInstruction = async (req, res, next) => {
    try {
        const includeContent = req.query.includeContent === 'true';
        const instruction = await getSystemInstructionById(req.params.id, { includeContent });
        return res.status(200).json({ data: instruction });
    } catch (err) {
        next(err);
    }
};

const postSystemInstruction = async (req, res, next) => {
    try {
        const instruction = await createSystemInstruction(req.body);
        return res.status(201).json({ data: toLeanInstruction(instruction) });
    } catch (err) {
        next(err);
    }
};

const patchSystemInstructionName = async (req, res, next) => {
    try {
        const instruction = await updateSystemInstructionName(req.params.id, req.body.name);
        return res.status(200).json({ data: instruction });
    } catch (err) {
        next(err);
    }
};

const removeSystemInstruction = async (req, res, next) => {
    try {
        const instruction = await archiveSystemInstruction(req.params.id);
        return res.status(200).json({ data: instruction });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getInstructionTypes,
    getSystemInstructionsMeta,
    getSystemInstructions,
    getSystemInstruction,
    postSystemInstruction,
    patchSystemInstructionName,
    removeSystemInstruction,
};
