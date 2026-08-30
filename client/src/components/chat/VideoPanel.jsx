import React, { useEffect, useRef, useState } from 'react';
import { getAvatarUrl, getInitialAvatarUrl } from '../../utils/imageUrl';
import './VideoPanel.css';
import './VideoBeauty.css';

const CAMERA_FILTERS = [
    { id: 'natural', label: 'Tự nhiên', value: 'none' },
    { id: 'beauty', label: 'Da mịn', value: 'brightness(1.06) saturate(1.07) contrast(.92) blur(.35px)' },
    { id: 'peach', label: 'Hồng hào', value: 'brightness(1.07) saturate(1.18) sepia(.08) hue-rotate(338deg) contrast(.94)' },
    { id: 'glow', label: 'Glow nhẹ', value: 'brightness(1.12) saturate(1.1) contrast(.96) drop-shadow(0 0 10px rgba(255, 215, 225, .12))' },
    { id: 'warm', label: 'Ấm áp', value: 'saturate(1.18) sepia(.16) contrast(1.04)' },
    { id: 'cool', label: 'Mát lạnh', value: 'saturate(.92) hue-rotate(12deg) brightness(1.05)' },
    { id: 'contrast', label: 'Tương phản', value: 'contrast(1.22) saturate(1.08)' },
    { id: 'mono', label: 'Đen trắng', value: 'grayscale(1) contrast(1.12)' },
];

const VideoPanel = ({ remoteStream, localStream, isLocalMuted = false, partnerInfo, isCameraOff = false, isRemoteCameraOff = false, myAvatar = '', remoteAvatar = '', remoteFilter = 'natural', onFilterChange }) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const [activeFilter, setActiveFilter] = useState('natural');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const remoteAvatarSrc = getAvatarUrl(remoteAvatar || partnerInfo?.avatar, partnerInfo?.username);
    const localAvatarSrc = getAvatarUrl(myAvatar, 'Bạn');
    const selectedFilter = CAMERA_FILTERS.find((filter) => filter.id === activeFilter) || CAMERA_FILTERS[0];
    const selectedRemoteFilter = CAMERA_FILTERS.find((filter) => filter.id === remoteFilter) || CAMERA_FILTERS[0];

    useEffect(() => {
        const video = localVideoRef.current;
        if (video && localStream && !isCameraOff) {
            video.srcObject = localStream;
            video.play().catch((error) => { if (error.name !== 'AbortError') console.error('Không thể phát camera cục bộ:', error); });
        }
    }, [localStream, isCameraOff]);

    useEffect(() => {
        const video = remoteVideoRef.current;
        if (video && remoteStream && !isRemoteCameraOff) {
            video.srcObject = remoteStream;
            video.play().catch((error) => { if (error.name !== 'AbortError') console.error('Không thể phát camera đối phương:', error); });
        }
    }, [remoteStream, isRemoteCameraOff]);

    return <div className="video-panel-wrapper">
        <div className="remote-video-container">
            {isRemoteCameraOff ? <div className="avatar-placeholder"><img src={remoteAvatarSrc} alt="Avatar đối phương" className="fallback-avatar" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getInitialAvatarUrl(partnerInfo?.username); }} /><p>{partnerInfo?.username || 'Đối phương'} đã tắt camera</p></div> : <video ref={remoteVideoRef} autoPlay playsInline style={{ filter: selectedRemoteFilter.value }} />}
            {!remoteStream && !isRemoteCameraOff && <div className="waiting-overlay"><div className="spinner" /><p>Đang kết nối video với {partnerInfo?.username || 'đối phương'}...</p></div>}
        </div>
        <div className="local-video-container">
            {isCameraOff ? <div className="avatar-placeholder-local"><img src={localAvatarSrc} alt="Avatar của bạn" className="fallback-avatar" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = getInitialAvatarUrl('Bạn'); }} /></div> : <video ref={localVideoRef} autoPlay playsInline muted={isLocalMuted} style={{ filter: selectedFilter.value }} />}
        </div>
        {!isCameraOff && <div className="camera-filter-control">
            <button type="button" className="camera-filter-trigger" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((open) => !open)}>Hiệu ứng</button>
            {filtersOpen && <div className="camera-filter-menu" role="group" aria-label="Hiệu ứng camera">{CAMERA_FILTERS.map((filter) => <button type="button" key={filter.id} className={activeFilter === filter.id ? 'active' : ''} onClick={() => { setActiveFilter(filter.id); onFilterChange?.(filter.id); setFiltersOpen(false); }}><span className={`filter-preview ${filter.id}`} />{filter.label}</button>)}</div>}
        </div>}
    </div>;
};

export default VideoPanel;
