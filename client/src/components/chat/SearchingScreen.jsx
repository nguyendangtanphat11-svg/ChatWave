import React from 'react';

const SearchingScreen = ({ onCancel }) => {
    return (
        <div className="chat-searching-container">
            <div className="chat-loader"></div>
            <h2 className="chat-searching-text">Đang tìm người lạ...</h2>
            <button className="chat-cancel-button" onClick={onCancel}>Hủy</button>
        </div>
    );
};

export default SearchingScreen;