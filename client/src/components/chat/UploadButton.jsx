import React, { useRef, useState } from 'react';
import axios from 'axios';
import './UploadButton.css';

const UploadButton = ({ onUploadComplete }) => {
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append(type, file); // 'image' hoặc 'file'

        const url = `${import.meta.env.VITE_API_URL}/api/upload/${type}`;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const response = await axios.post(url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                },
            });

            // Gửi thông tin file qua socket
            onUploadComplete({
                type: response.data.type,
                url: `${import.meta.env.VITE_API_URL}${response.data.url}`,
                fileName: response.data.fileName,
                size: response.data.size,
            });

        } catch (error) {
            console.error('Upload failed:', error);
            alert(error.response?.data?.message || 'Upload thất bại. Vui lòng thử lại.');
        } finally {
            setIsUploading(false);
            // Reset input để có thể chọn lại cùng một file
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
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => handleFileChange(e, 'image')}
            />
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                onChange={(e) => handleFileChange(e, 'file')}
            />

            <button className="upload-icon-btn" onClick={() => imageInputRef.current.click()} disabled={isUploading} title="Gửi ảnh">
                📷
            </button>
            <button className="upload-icon-btn" onClick={() => fileInputRef.current.click()} disabled={isUploading} title="Đính kèm file">
                📎
            </button>
        </div>
    );
};

export default UploadButton;
