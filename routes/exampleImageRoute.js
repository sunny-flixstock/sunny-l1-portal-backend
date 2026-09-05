const router = require('express').Router();
const {
    getExampleImages,
    getExampleImageTags,
    getExampleImageMeta,
    getExampleImage,
    postPresignUploads,
    postExampleImage,
    putExampleImage,
    patchExampleImagesBatch,
    postThumbnailStatus,
    removeExampleImage,
} = require('../controllers/ExampleImage');
const exampleImageValidation = require('../validations/exampleImage.validation');

router.get('/meta', getExampleImageMeta);
router.get('/tags', exampleImageValidation.listTags, getExampleImageTags);
router.get('/', exampleImageValidation.listExampleImages, getExampleImages);
router.get('/:id', exampleImageValidation.getExampleImage, getExampleImage);
router.post('/presign', exampleImageValidation.presignUploads, postPresignUploads);
router.post('/thumbnail-status', exampleImageValidation.thumbnailStatus, postThumbnailStatus);
router.post('/batch-update', exampleImageValidation.batchUpdateExampleImages, patchExampleImagesBatch);
router.post('/', exampleImageValidation.createExampleImage, postExampleImage);
router.put('/:id', exampleImageValidation.updateExampleImage, putExampleImage);
router.delete('/:id', exampleImageValidation.deleteExampleImage, removeExampleImage);

module.exports = router;
