const handleUpload = (req, res, fileType) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Không có file nào được tải lên.' });
    }

    // Xử lý lỗi từ multer (ví dụ: file quá lớn, sai định dạng)
    if (req.multerError) {
        return res.status(400).json({ message: req.multerError });
    }

    const fileUrl = `/uploads/${fileType}s/${req.file.filename}`;

    res.status(200).json({
        url: fileUrl,
        type: fileType,
        fileName: req.file.originalname,
        size: req.file.size
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
