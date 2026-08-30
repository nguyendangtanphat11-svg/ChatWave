const express = require('express');
const router = express.Router();

// Sử dụng đường dẫn tĩnh tuyệt đối thay vì path.join động để tránh lỗi phân giải module
const { uploadImage, uploadFile, validateUploadedFile } = require('../middleware/upload');
const { uploadImageController, uploadFileController } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

const handleMulterError = (multerUpload) => (req, res, next) => {
    multerUpload(req, res, (err) => {
        if (err instanceof require('multer').MulterError) {
            req.multerError = err.message;
            req.multerErrorCode = err.code;
        } else if (err) {
            req.multerError = err.message;
            req.multerErrorCode = err.code;
        }
        next();
    });
};

router.post('/image', protect, handleMulterError(uploadImage), validateUploadedFile, uploadImageController);
router.post('/file', protect, handleMulterError(uploadFile), validateUploadedFile, uploadFileController);

module.exports = router;
