import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';
import { NotificationContext } from './notificationContextValue';
import './NotificationContext.css';

const icons = { success: FaCheckCircle, error: FaExclamationCircle, info: FaInfoCircle };

export function NotificationProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [confirmation, setConfirmation] = useState(null);
    const cancelButtonRef = useRef(null);

    const toast = useCallback((message, type = 'info') => {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((previous) => [...previous, { id, message, type }].slice(-4));
        window.setTimeout(() => setToasts((previous) => previous.filter((item) => item.id !== id)), 4200);
    }, []);

    const confirm = useCallback(({ title = 'Xác nhận thao tác', message, confirmLabel = 'Xác nhận', danger = false }) => new Promise((resolve) => {
        setConfirmation({ title, message, confirmLabel, danger, resolve });
    }), []);

    const closeConfirmation = useCallback((accepted) => {
        setConfirmation((current) => {
            current?.resolve(accepted);
            return null;
        });
    }, []);

    useEffect(() => {
        if (!confirmation) return undefined;
        cancelButtonRef.current?.focus();
        const onKeyDown = (event) => { if (event.key === 'Escape') closeConfirmation(false); };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [confirmation, closeConfirmation]);

    return <NotificationContext.Provider value={{ toast, confirm }}>
        {children}
        <div className="app-toasts" aria-live="polite" aria-atomic="true">
            {toasts.map(({ id, message, type }) => {
                const Icon = icons[type] || FaInfoCircle;
                return <div className={`app-toast ${type}`} key={id}><Icon aria-hidden="true" /><span>{message}</span><button type="button" aria-label="Đóng thông báo" onClick={() => setToasts((previous) => previous.filter((item) => item.id !== id))}><FaTimes /></button></div>;
            })}
        </div>
        {confirmation && <div className="app-confirm-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeConfirmation(false); }}>
            <section className="app-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="app-confirm-title" aria-describedby="app-confirm-message">
                <div className={`app-confirm-icon ${confirmation.danger ? 'danger' : ''}`}><FaExclamationCircle /></div>
                <h2 id="app-confirm-title">{confirmation.title}</h2>
                <p id="app-confirm-message">{confirmation.message}</p>
                <div className="app-confirm-actions"><button ref={cancelButtonRef} type="button" className="app-confirm-cancel" onClick={() => closeConfirmation(false)}>Hủy</button><button type="button" className={confirmation.danger ? 'app-confirm-danger' : 'app-confirm-primary'} onClick={() => closeConfirmation(true)}>{confirmation.confirmLabel}</button></div>
            </section>
        </div>}
    </NotificationContext.Provider>;
}
