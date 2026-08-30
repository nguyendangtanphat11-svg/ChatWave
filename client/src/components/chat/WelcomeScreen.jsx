import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './WelcomeBeauty.css';

// --- SVG Icons ---
const LogoIcon = () => <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 24C12 21.7909 13.7909 20 16 20C18.2091 20 20 21.7909 20 24C20 26.2091 18.2091 28 16 28C13.7909 28 12 26.2091 12 24Z" stroke="currentColor" strokeWidth="3"/><path d="M20 24C20 19.5817 23.5817 16 28 16C32.4183 16 36 19.5817 36 24C36 28.4183 32.4183 32 28 32C23.5817 32 20 28.4183 20 24Z" stroke="currentColor" strokeWidth="3"/></svg>;
const CameraIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m23 7-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>;
const MicIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const CameraOffIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"></path></svg>;
const MicOffIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>;
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

const BEAUTY_EFFECTS = [
    { id: 'natural', label: 'Tự nhiên', filter: 'none' },
    { id: 'beauty', label: 'Da mịn', filter: 'brightness(1.06) saturate(1.07) contrast(.92) blur(.35px)' },
    { id: 'peach', label: 'Hồng hào', filter: 'brightness(1.07) saturate(1.18) sepia(.08) hue-rotate(338deg) contrast(.94)' },
    { id: 'glow', label: 'Glow nhẹ', filter: 'brightness(1.12) saturate(1.1) contrast(.96) drop-shadow(0 0 10px rgba(255, 215, 225, .12))' },
];

const WelcomeScreen = ({ onStart, initialPreferences = {} }) => {
    const [stream, setStream] = useState(null);
    const [permissionError, setPermissionError] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);
    const [matchGender, setMatchGender] = useState(initialPreferences.gender || 'all');
    const [matchCountry, setMatchCountry] = useState(initialPreferences.country || 'all');
    const [activeBeautyEffect, setActiveBeautyEffect] = useState('natural');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const mediaRequestIdRef = useRef(0);
    const streamTransferredRef = useRef(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const selectedBeautyEffect = BEAUTY_EFFECTS.find((effect) => effect.id === activeBeautyEffect) || BEAUTY_EFFECTS[0];

    const getMedia = async () => {
        const requestId = ++mediaRequestIdRef.current;
        const previousStream = streamRef.current;
        if (previousStream) {
            previousStream.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
            setStream(null);
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            if (requestId !== mediaRequestIdRef.current) {
                mediaStream.getTracks().forEach((track) => track.stop());
                return;
            }

            streamRef.current = mediaStream;
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setPermissionError(false);
        } catch (err) {
            console.error("Lỗi xin quyền media:", err);
            setPermissionError(true);
        }
    };

    useEffect(() => {
        getMedia();

        return () => {
            mediaRequestIdRef.current += 1;
            if (!streamTransferredRef.current && streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            }
        };
    }, []);

    const toggleCamera = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            setIsCameraOn(videoTrack.enabled);
        }
    };

    const toggleMic = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            setIsMicOn(audioTrack.enabled);
        }
    };

    const handleStart = () => {
        if (streamRef.current) {
            streamTransferredRef.current = true;
            onStart(streamRef.current, { gender: matchGender, country: matchCountry });
        }
    };

    const handleGoHome = () => {
        mediaRequestIdRef.current += 1;
        streamTransferredRef.current = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        navigate('/');
    };

    return (
        <div className="welcome-background">
            <div className="welcome-glow-1"></div>
            <div className="welcome-glow-2"></div>
            <div className="welcome-card fade-in-up">
                <div className="welcome-header">
                    <div className="welcome-logo"><LogoIcon /><span>ChatWave</span></div>
                    <h1 className="welcome-title">Kết nối với mọi người trên toàn thế giới</h1>
                    <p className="welcome-description">Sẵn sàng cho những cuộc trò chuyện video ngẫu nhiên, an toàn và đầy thú vị.</p>
                </div>

                <div className="welcome-preview-wrapper">
                    <div className="welcome-preview-container">
                        {permissionError ? (
                            <div className="welcome-permission-error">
                                <span role="img" aria-label="warning">⚠️</span>
                                <h3>Yêu cầu quyền truy cập</h3>
                                <p>ChatWave cần quyền sử dụng Camera và Micro để bạn có thể bắt đầu.</p>
                                <button className="welcome-button primary small" onClick={getMedia}>Cấp quyền lại</button>
                            </div>
                        ) : (
                            <>
                                <video ref={videoRef} autoPlay playsInline muted className="welcome-video-preview" style={{ opacity: isCameraOn ? 1 : 0, filter: selectedBeautyEffect.filter }} />
                                {!isCameraOn && (
                                    <div className="welcome-camera-off-overlay">
                                        <CameraOffIcon />
                                        <span>Camera đã tắt</span>
                                    </div>
                                )}
                                <div className="welcome-video-badge live">LIVE</div>
                                <div className="welcome-video-badge name">{user?.username || 'Bạn'}</div>
                            </>
                        )}
                    </div>
                </div>

                <section className="welcome-beauty-panel" aria-label="Thử hiệu ứng camera">
                    <div className="welcome-beauty-heading">
                        <div>
                            <strong>Hiệu ứng làm đẹp</strong>
                            <span>Áp dụng trực tiếp lên camera thử</span>
                        </div>
                        <span className="welcome-beauty-selected">{selectedBeautyEffect.label}</span>
                    </div>
                    <div className="welcome-beauty-options" role="radiogroup" aria-label="Chọn hiệu ứng làm đẹp">
                        {BEAUTY_EFFECTS.map((effect) => (
                            <button
                                type="button"
                                key={effect.id}
                                className={`welcome-beauty-option ${activeBeautyEffect === effect.id ? 'active' : ''}`}
                                role="radio"
                                aria-checked={activeBeautyEffect === effect.id}
                                onClick={() => setActiveBeautyEffect(effect.id)}
                            >
                                <span className={`welcome-beauty-swatch ${effect.id}`} aria-hidden="true" />
                                {effect.label}
                            </button>
                        ))}
                    </div>
                </section>

                <div className="welcome-status-row">
                    <div className={`welcome-status-card ${isCameraOn ? 'on' : 'off'}`}>
                        <span className="status-icon">{isCameraOn ? '🟢' : '🔴'}</span>
                        <div className="status-text">
                            <strong>Camera</strong>
                            <span>{isCameraOn ? 'Đang hoạt động' : 'Đã tắt'}</span>
                        </div>
                    </div>
                    <div className={`welcome-status-card ${isMicOn ? 'on' : 'off'}`}>
                        <span className="status-icon">{isMicOn ? '🟢' : '🔴'}</span>
                        <div className="status-text">
                            <strong>Microphone</strong>
                            <span>{isMicOn ? 'Đang hoạt động' : 'Đã tắt'}</span>
                        </div>
                    </div>
                </div>

                <div className="welcome-controls">
                    <button className={`welcome-icon-button ${!isCameraOn ? 'active' : ''}`} onClick={toggleCamera} disabled={!stream} title="Bật/Tắt Camera"><CameraIcon /></button>
                    <button className={`welcome-icon-button ${!isMicOn ? 'active' : ''}`} onClick={toggleMic} disabled={!stream} title="Bật/Tắt Micro"><MicIcon /></button>
                    
                </div>

                <fieldset className="welcome-match-filters">
                    <legend>Tìm bạn theo sở thích</legend>
                    <label className="welcome-filter-field" htmlFor="match-gender">
                        <span>Giới tính</span>
                        <select id="match-gender" value={matchGender} onChange={(event) => setMatchGender(event.target.value)}>
                            <option value="all">Tất cả</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                        </select>
                    </label>
                    <label className="welcome-filter-field" htmlFor="match-country">
                        <span>Quốc gia</span>
                        <select id="match-country" value={matchCountry} onChange={(event) => setMatchCountry(event.target.value)}>
                            <option value="all">Tất cả quốc gia</option>
                            <option value="VN">Việt Nam</option>
                            <option value="US">Hoa Kỳ</option>
                            <option value="JP">Nhật Bản</option>
                            <option value="KR">Hàn Quốc</option>
                            <option value="GB">Vương quốc Anh</option>
                            <option value="AU">Úc</option>
                            <option value="CA">Canada</option>
                        </select>
                    </label>
                </fieldset>

                <div className="welcome-actions">
                    <button className="welcome-button primary" onClick={handleStart} disabled={!stream || permissionError}>
                         Bắt đầu tìm người
                    </button>
                    <button 
            className="welcome-button secondary" 
            onClick={handleGoHome}
        >
            Về trang chủ
        </button>
                </div>

                <p className="welcome-tip">💡 Mẹo: Luôn giữ thái độ tôn trọng và cởi mở để có những cuộc trò chuyện tuyệt vời nhất.</p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
