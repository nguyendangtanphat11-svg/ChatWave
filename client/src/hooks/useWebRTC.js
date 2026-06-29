import { useRef, useCallback } from 'react';

const peerConnectionConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

/**
 * Custom hook to manage the WebRTC peer connection.
 * @param {object} options - Options including socket, localStream, and remoteVideoRef.
 * @returns {object} - An object containing the peerRef and WebRTC-related functions.
 */
const useWebRTC = ({ socketRef, localStreamRef, remoteVideoRef }) => {
    const peerRef = useRef();

    const createPeerConnection = useCallback(async (partnerId, initiator) => {
        if (!localStreamRef.current) {
            console.error("Local stream is not available to create peer connection.");
            return;
        }

        peerRef.current = new RTCPeerConnection(peerConnectionConfig);
        console.log("Peer connection created.");

        // Add local media tracks to the peer connection
        localStreamRef.current.getTracks().forEach(track => {
            peerRef.current.addTrack(track, localStreamRef.current);
        });

        // When the remote peer adds a track, display it
        peerRef.current.ontrack = (event) => {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
        };

        // When a new ICE candidate is generated, send it to the partner
        peerRef.current.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("signal", {
                    to: partnerId,
                    signal: { type: "ice-candidate", candidate: event.candidate },
                });
            }
        };

        // If this client is the initiator, create and send an offer
        if (initiator) {
            const offer = await peerRef.current.createOffer();
            await peerRef.current.setLocalDescription(offer);
            socketRef.current.emit('signal', {
                to: partnerId,
                signal: { type: 'offer', sdp: offer.sdp },
            });
        }
    }, [localStreamRef, remoteVideoRef, socketRef]);

    const handleSignalingData = useCallback(async ({ from, signal }) => {
        if (!peerRef.current) return;

        try {
            if (signal.type === "offer") {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await peerRef.current.createAnswer();
                await peerRef.current.setLocalDescription(answer);
                socketRef.current.emit("signal", {
                    to: from,
                    signal: { type: "answer", sdp: answer.sdp },
                });
            } else if (signal.type === "answer") {
                await peerRef.current.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.type === "ice-candidate") {
                await peerRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (error) {
            console.error("Error handling signaling data:", error);
        }
    }, [socketRef]);

    const closePeerConnection = useCallback(() => {
        if (peerRef.current) {
            peerRef.current.close();
            peerRef.current = null;
            console.log("Peer connection closed.");
        }
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }
    }, [remoteVideoRef]);

    return { peerRef, createPeerConnection, handleSignalingData, closePeerConnection };
};

export default useWebRTC;