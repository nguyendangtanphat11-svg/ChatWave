const express = require('express');
const router = express.Router();
const { uploadImage, uploadFile } = require('../middlewares/upload');
const { uploadImageController, uploadFileController } = require('../controllers/uploadController');

// Middleware để bắt lỗi từ Multer và truyền vào request
const handleMulterError = (multerUpload) => (req, res, next) => {
    multerUpload(req, res, (err) => {
        if (err instanceof require('multer').MulterError) {
            // Lỗi do Multer (ví dụ: file quá lớn)
            req.multerError = err.message;
        } else if (err) {
            // Lỗi khác (ví dụ: sai định dạng file từ fileFilter)
            req.multerError = err.message;
        }
        next();
    });
};

// Route để upload ảnh
router.post('/image', handleMulterError(uploadImage), uploadImageController);

// Route để upload file
router.post('/file', handleMulterError(uploadFile), uploadFileController);

module.exports = router;
