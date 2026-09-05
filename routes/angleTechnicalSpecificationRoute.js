const router = require('express').Router();
const {
    getAngleTechnicalSpecifications,
    getAngleTechnicalSpecification,
    postAngleTechnicalSpecification,
    removeAngleTechnicalSpecification,
    getAngleTechnicalSpecificationMetaHandler,
} = require('../controllers/AngleTechnicalSpecification');
const angleTechnicalSpecificationValidation = require('../validations/angleTechnicalSpecification.validation');

router.get('/meta', getAngleTechnicalSpecificationMetaHandler);
router.get(
    '/',
    angleTechnicalSpecificationValidation.listAngleTechnicalSpecifications,
    getAngleTechnicalSpecifications
);
router.get(
    '/:id',
    angleTechnicalSpecificationValidation.getAngleTechnicalSpecification,
    getAngleTechnicalSpecification
);
router.post(
    '/',
    angleTechnicalSpecificationValidation.createAngleTechnicalSpecification,
    postAngleTechnicalSpecification
);
router.delete(
    '/:id',
    angleTechnicalSpecificationValidation.deleteAngleTechnicalSpecification,
    removeAngleTechnicalSpecification
);

module.exports = router;
