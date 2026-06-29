import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import config from '../config/config';

/**
 * Custom hook to manage Socket.IO connection and events.
 * @param {object} handlers - An object containing event handlers for socket events.
 * @returns {React.MutableRefObject<Socket>} - A ref to the socket instance.
 */
const useSocket = (handlers) => {
    const socketRef = useRef(null);

    useEffect(() => {
        // Disconnect any existing socket before creating a new one.
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Establish a new connection.
        socketRef.current = io.connect(config.SOCKET_URL);
        const socket = socketRef.current;

        // --- Standard Connection Listeners ---
        socket.on("connect", () => {
            console.log("✅ Socket Connected:", socket.id);
        });

        socket.on("disconnect", (reason) => {
            console.log("❌ Socket Disconnected:", reason);
            if (handlers.onDisconnect) {
                handlers.onDisconnect();
            }
        });

        socket.on("connect_error", (err) => {
            console.error("❌ Socket Connection Error:", err.message);
        });

        // --- Application-Specific Listeners ---
        if (handlers.onMatchFound) socket.on("matchFound", handlers.onMatchFound);
        if (handlers.onChatMessage) socket.on("chatMessage", handlers.onChatMessage);
        if (handlers.onPartnerDisconnected) socket.on("partnerDisconnected", handlers.onPartnerDisconnected);
        if (handlers.onSignal) socket.on("signal", handlers.onSignal);
        if (handlers.onPartnerMediaState) socket.on("partnerMediaState", handlers.onPartnerMediaState);
        if (handlers.onRejoinQueue) socket.on("rejoinQueue", handlers.onRejoinQueue);

        // --- Cleanup on unmount ---
        return () => {
            console.log("Cleaning up socket connection.");
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on component mount.

    return socketRef;
};

export default useSocket;