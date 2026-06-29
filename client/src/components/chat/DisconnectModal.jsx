import React from 'react';

const DisconnectModal = ({ onFindNew, onGoHome }) => {
    return (
        <div className="chat-popup-overlay">
            <div className="chat-popup-box">
                <h3>Người lạ đã ngắt kết nối</h3>
                <p>Bạn muốn làm gì tiếp theo?</p>
                <div className="chat-popup-actions">
                    <button className="chat-popup-btn secondary" onClick={onGoHome}>Về màn hình chính</button>
                    <button className="chat-popup-btn primary" onClick={onFindNew}>Tìm người khác</button>
                </div>
            </div>
        </div>
    );
};

export default DisconnectModal;