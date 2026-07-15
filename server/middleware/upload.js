const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Đảm bảo các thư mục upload tồn tại
const imageDir = path.join(__dirname, '..', 'uploads', 'images');
const fileDir = path.join(__dirname, '..', 'uploads', 'files');
fs.mkdirSync(imageDir, { recursive: true });
fs.mkdirSync(fileDir, { recursive: true });

// --- Cấu hình cho upload ảnh ---
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, imageDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const imageFileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Định dạng ảnh không hợp lệ. Chỉ chấp nhận jpg, png, gif, webp.'), false);
    }
};

const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).single('image'); // 'image' là tên field trong form-data

// --- Cấu hình cho upload file ---
const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, fileDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const genericFileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/zip',
        'application/x-rar-compressed'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Định dạng file không được hỗ trợ.'), false);
    }
};

const uploadFile = multer({
    storage: fileStorage,
    fileFilter: genericFileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
}).single('file'); // 'file' là tên field trong form-data

module.exports = {
    uploadImage,
    uploadFile
};
