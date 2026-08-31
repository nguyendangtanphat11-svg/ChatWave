import { getUploadUrl } from '../../utils/imageUrl';
import './ImageMessage.css';

const ImageMessage = ({ url, sender }) => {
    const uploadUrl = getUploadUrl(url);

    const openImageInNewTab = () => {
        window.open(uploadUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className={`image-message ${sender === 'me' ? 'sent' : 'received'}`} onClick={openImageInNewTab}>
            <img src={uploadUrl} alt="Sent content" className="image-message-content" />
        </div>
    );
};

export default ImageMessage;
