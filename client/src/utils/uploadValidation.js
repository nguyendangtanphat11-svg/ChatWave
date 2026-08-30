export const MAX_CHAT_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024;

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

export const CHAT_IMAGE_ACCEPT = 'image/jpeg,image/png,image/gif,image/webp';
export const CHAT_FILE_ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';

const getExtension = (name = '') => {
    const dotIndex = name.lastIndexOf('.');
    return dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : '';
};

export const validateChatUpload = (file, type) => {
    const mimeExtensions = type === 'image' ? imageMimeExtensions : fileMimeExtensions;
    const maxSize = type === 'image' ? MAX_CHAT_IMAGE_SIZE : MAX_CHAT_FILE_SIZE;
    const allowedExtensions = mimeExtensions.get(file.type);

    if (!allowedExtensions || !allowedExtensions.includes(getExtension(file.name))) {
        return type === 'image'
            ? 'Chỉ hỗ trợ ảnh JPG, JPEG, PNG, WEBP hoặc GIF hợp lệ.'
            : 'Chỉ hỗ trợ PDF, TXT, DOC/DOCX, XLS/XLSX hoặc PPT/PPTX hợp lệ.';
    }

    if (file.size > maxSize) {
        return type === 'image'
            ? 'Ảnh không được vượt quá 5 MB.'
            : 'Tệp đính kèm không được vượt quá 10 MB.';
    }

    return '';
};
