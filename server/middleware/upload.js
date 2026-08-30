const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const imageDir = path.join(__dirname, '..', 'uploads', 'images');
const coverDir = path.join(__dirname, '..', 'uploads', 'covers');
const fileDir = path.join(__dirname, '..', 'uploads', 'files');

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_COVER_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const imageMimeExtensions = new Map([
    ['image/jpeg', ['.jpg', '.jpeg']],
    ['image/png', ['.png']],
    ['image/webp', ['.webp']],
    ['image/gif', ['.gif']],
]);

const fileMimeExtensions = new Map([
    ['application/pdf', ['.pdf']],
    ['text/plain', ['.txt']],
    ['application/msword', ['.doc']],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ['.docx']],
    ['application/vnd.ms-excel', ['.xls']],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ['.xlsx']],
    ['application/vnd.ms-powerpoint', ['.ppt']],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', ['.pptx']],
]);

[imageDir, coverDir, fileDir].forEach((directory) => fs.mkdirSync(directory, { recursive: true }));

const getExtension = (fileName = '') => path.extname(fileName).toLowerCase();

const createFileFilter = (mimeExtensions, message) => (req, file, callback) => {
    const allowedExtensions = mimeExtensions.get(file.mimetype);
    const extension = getExtension(file.originalname);
    if (!allowedExtensions || !allowedExtensions.includes(extension)) {
        const error = new Error(message);
        error.status = 400;
        return callback(error);
    }
    return callback(null, true);
};

const createStorage = (destination) => multer.diskStorage({
    destination: (req, file, callback) => callback(null, destination),
    filename: (req, file, callback) => callback(null, `${uuidv4()}${getExtension(file.originalname)}`),
});

const imageFilter = createFileFilter(
    imageMimeExtensions,
    'Chỉ chấp nhận ảnh JPG, JPEG, PNG, WEBP hoặc GIF hợp lệ.',
);
const fileFilter = createFileFilter(
    fileMimeExtensions,
    'Loại tệp không được hỗ trợ hoặc phần mở rộng không khớp MIME type.',
);

const uploadImage = multer({
    storage: createStorage(imageDir),
    fileFilter: imageFilter,
    limits: { fileSize: MAX_IMAGE_SIZE, files: 1, fields: 10, fieldNameSize: 100, fieldSize: 64 * 1024 },
}).single('image');

const uploadCover = multer({
    storage: createStorage(coverDir),
    fileFilter: imageFilter,
    limits: { fileSize: MAX_COVER_SIZE, files: 1, fields: 10, fieldNameSize: 100, fieldSize: 64 * 1024 },
}).single('cover');

const uploadFile = multer({
    storage: createStorage(fileDir),
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: 1, fields: 10, fieldNameSize: 100, fieldSize: 64 * 1024 },
}).single('file');

const startsWith = (buffer, bytes) => buffer.subarray(0, bytes.length).equals(Buffer.from(bytes));
const isZipHeader = (buffer) => startsWith(buffer, [0x50, 0x4B, 0x03, 0x04]) || startsWith(buffer, [0x50, 0x4B, 0x05, 0x06]);
const isOleHeader = (buffer) => startsWith(buffer, [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]);

const contentMatchesFile = (file, header) => {
    switch (file.mimetype) {
        case 'image/jpeg':
            return startsWith(header, [0xFF, 0xD8, 0xFF]);
        case 'image/png':
            return startsWith(header, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        case 'image/gif':
            return header.subarray(0, 6).toString('ascii') === 'GIF87a'
                || header.subarray(0, 6).toString('ascii') === 'GIF89a';
        case 'image/webp':
            return header.subarray(0, 4).toString('ascii') === 'RIFF'
                && header.subarray(8, 12).toString('ascii') === 'WEBP';
        case 'application/pdf':
            return header.subarray(0, 5).toString('ascii') === '%PDF-';
        case 'application/msword':
        case 'application/vnd.ms-excel':
        case 'application/vnd.ms-powerpoint':
            return isOleHeader(header);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            return isZipHeader(header);
        case 'text/plain':
            return !header.includes(0);
        default:
            return false;
    }
};

const readFileHeader = async (filePath) => {
    const file = await fs.promises.open(filePath, 'r');
    try {
        const buffer = Buffer.alloc(512);
        const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
        return buffer.subarray(0, bytesRead);
    } finally {
        await file.close();
    }
};

const removeUploadedFile = async (file) => {
    if (!file?.path) return;
    try {
        await fs.promises.unlink(file.path);
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('Không thể xóa tệp upload không hợp lệ:', error);
    }
};

const validateUploadedFile = async (req, res, next) => {
    if (req.multerError || !req.file) return next();

    try {
        const header = await readFileHeader(req.file.path);
        if (!contentMatchesFile(req.file, header)) {
            await removeUploadedFile(req.file);
            return res.status(400).json({ message: 'Nội dung tệp không khớp với loại tệp được khai báo.' });
        }
        return next();
    } catch (error) {
        await removeUploadedFile(req.file);
        return next(error);
    }
};

const sanitizeOriginalFileName = (fileName = '') => {
    const cleaned = path.basename(String(fileName)).replace(/[\u0000-\u001F\u007F]/g, '').trim();
    return cleaned.slice(0, 180) || 'file';
};

module.exports = {
    uploadImage,
    uploadCover,
    uploadFile,
    validateUploadedFile,
    sanitizeOriginalFileName,
    MAX_IMAGE_SIZE,
    MAX_FILE_SIZE,
};
