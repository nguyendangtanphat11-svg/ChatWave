import React, { useRef, useState } from 'react';
import axios from 'axios';
import { useNotifications } from '../../contexts/NotificationContext';
import { CHAT_FILE_ACCEPT, CHAT_IMAGE_ACCEPT, validateChatUpload } from '../../utils/uploadValidation';
import './UploadButton.css';

const UploadButton = ({ onUploadComplete }) => {
    const { toast } = useNotifications();
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const validationError = validateChatUpload(file, type);
        if (validationError) {
            toast(validationError, 'error');
            event.target.value = '';
            return;
        }

        const formData = new FormData();
        formData.append(type, file);

        const url = `/api/upload/${type}`;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted);
                    }
                },
            });

            const uploadedUrl = response.data.url;
            if (!uploadedUrl) {
                throw new Error('Máy chủ không trả về đường dẫn tệp.');
            }

            onUploadComplete({
                type: response.data.type,
                url: uploadedUrl,
                fileName: response.data.fileName,
                size: response.data.size,
                mimeType: response.data.mimeType,
            });

        } catch (error) {
            console.error('Upload failed:', error);
            toast(error.response?.data?.message || 'Upload thất bại. Vui lòng thử lại.', 'error');
        } finally {
            setIsUploading(false);
            event.target.value = null;
        }
    };

    return (
        <div className="upload-buttons-container">
            {isUploading && (
                <div className="upload-progress-bar">
                    <div style={{ width: `${uploadProgress}%` }}></div>
                </div>
            )}
            <input
                type="file"
                ref={imageInputRef}
                style={{ display: 'none' }}
                accept={CHAT_IMAGE_ACCEPT}
                onChange={(e) => handleFileChange(e, 'image')}
            />
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept={CHAT_FILE_ACCEPT}
                onChange={(e) => handleFileChange(e, 'file')}
            />

            <button 
                type="button" 
                className="upload-icon-btn" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    imageInputRef.current.click(); 
                }} 
                disabled={isUploading} 
                title="Gửi ảnh"
            >
                ➕
            </button>
            <button 
                type="button" 
                className="upload-icon-btn" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    fileInputRef.current.click(); 
                }} 
                disabled={isUploading} 
                title="Đính kèm file"
            >
                🗄
            </button>
        </div>
    );
};

export default UploadButton;
