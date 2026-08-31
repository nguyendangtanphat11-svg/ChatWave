import { getUploadUrl } from '../../utils/imageUrl';
import './FileMessage.css';

// Helper function to format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const FileMessage = ({ url, fileName, size, sender }) => {
    const uploadUrl = getUploadUrl(url);

    return (
        <div className={`file-message ${sender === 'me' ? 'sent' : 'received'}`}>
            <div className="file-info">
                <span className="file-icon">📄</span>
                <div className="file-details">
                    <span className="file-name">{fileName}</span>
                    <span className="file-size">{formatFileSize(size)}</span>
                </div>
            </div>
            <a href={uploadUrl} download={fileName} className="download-button" target="_blank" rel="noopener noreferrer">
                Download
            </a>
        </div>
    );
};

export default FileMessage;
