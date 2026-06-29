import React from 'react';
import SearchingScreen from './SearchingScreen';

const LiveIcon = () => <svg width="1em" height="1em" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"></circle></svg>;
const CameraOffIcon = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.512 3.002a3 3 0 00-2.88 2.133l-1.33 5.322a.75.75 0 00.37.833l.09.045a1.875 1.875 0 01.694 1.955l-1.293.97c-.135.101-.164.279-.087.431l4.258 7.373c.077.152.25.18.431.087l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.819V19.5a3 3 0 01-3 3h-2.25C6.55 22.5 1.5 17.45 1.5 10.5V8.25a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.33 5.322a.75.75 0 001.29.37l1.06-1.06-2.34-9.36a3 3 0 00-2.88-2.132zM21.75 8.62v6.76a.75.75 0 01-1.447.894l-3.44-1.72V15a3 3 0 01-3 3H9.362l-3.9-6.755a3.375 3.375 0 01.61-4.512l1.293-.97a3.375 3.375 0 013.52-.025l.09.045a2.25 2.25 0 001.588-.37l1.33-5.322a4.5 4.5 0 014.32-3.2h.378a.75.75 0 01.75.75v1.332l3.44-1.72a.75.75 0 011.06.621z" /></svg>;

const VideoPanel = ({ localVideoRef, remoteVideoRef, callState, partnerInfo, partnerMediaState, isCameraOff, onCancelSearch }) => {
    return (
        <main className="chat-video-area">
            <div className="chat-remote-video-wrapper">
                <video 
                    ref={remoteVideoRef} 
                    autoPlay 
                    playsInline 
                    className="chat-remote-video" 
                    style={{ opacity: callState === 'in-call' && !partnerMediaState.isCameraOff ? 1 : 0 }}
                ></video>

                <div className="chat-video-badges">
                    <div className="chat-video-badge live">
                        <LiveIcon /> LIVE
                    </div>
                    <div className="chat-video-badge status">🟢 Online</div>
                </div>
                
                <div className="chat-video-overlay">
                    {callState === 'searching' && <SearchingScreen onCancel={onCancelSearch} />}
                    
                    {callState === 'in-call' && partnerMediaState.isCameraOff && (
                        <div className="chat-video-placeholder">
                            <img 
                                className="chat-video-placeholder-avatar" 
                                src={partnerInfo?.avatar || `https://ui-avatars.com/api/?name=${partnerInfo?.username || '?'}&background=161b22&color=fff`} 
                                alt={partnerInfo?.username} 
                            />
                            <CameraOffIcon />
                            <span>{partnerInfo?.username || 'Người lạ'} đã tắt camera</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-local-video-wrapper">
                <video ref={localVideoRef} autoPlay playsInline muted className="chat-local-video" style={{ display: isCameraOff ? 'none' : 'block' }}></video>
                {isCameraOff && (
                    <div className="chat-local-video-off">
                        <CameraOffIcon />
                    </div>
                )}
            </div>
        </main>
    );
};

export default VideoPanel;