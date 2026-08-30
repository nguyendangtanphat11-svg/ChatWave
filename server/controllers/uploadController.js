const { sanitizeOriginalFileName } = require('../middleware/upload');

const handleUpload = (req, res, fileType) => {
    if (req.multerError) {
        const status = req.multerErrorCode === 'LIMIT_FILE_SIZE' ? 413 : 400;
        return res.status(status).json({ message: req.multerError });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được tải lên.' });
    }

    const fileUrl = `/uploads/${fileType}s/${req.file.filename}`;

    res.status(200).json({
        url: fileUrl,
        type: fileType,
        fileName: sanitizeOriginalFileName(req.file.originalname),
        size: req.file.size,
        mimeType: req.file.mimetype,
    });
};

const uploadImageController = (req, res) => {
    handleUpload(req, res, 'image');
};

const uploadFileController = (req, res) => {
    handleUpload(req, res, 'file');
};

module.exports = {
    uploadImageController,
    uploadFileController
};
