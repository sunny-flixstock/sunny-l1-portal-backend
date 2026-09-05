const router = require('express').Router();
const {
    getCategoryRegistries,
    getCategoryRegistry,
    postCategoryRegistry,
    removeCategoryRegistry,
} = require('../controllers/CategoryRegistry');
const categoryRegistryValidation = require('../validations/categoryRegistry.validation');

router.get('/', categoryRegistryValidation.listCategoryRegistries, getCategoryRegistries);
router.get('/:id', categoryRegistryValidation.getCategoryRegistry, getCategoryRegistry);
router.post('/', categoryRegistryValidation.createCategoryRegistry, postCategoryRegistry);
router.delete('/:id', categoryRegistryValidation.deleteCategoryRegistry, removeCategoryRegistry);

module.exports = router;
