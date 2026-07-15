import React from 'react';
import './ImageMessage.css';

const ImageMessage = ({ url, sender }) => {
    const openImageInNewTab = () => {
        window.open(url, '_blank');
    };

    return (
        <div className={`image-message ${sender === 'me' ? 'sent' : 'received'}`} onClick={openImageInNewTab}>
            <img src={url} alt="Sent content" className="image-message-content" />
        </div>
    );
};

export default ImageMessage;
