import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';

const RequestCard = ({ request, onRespond }) => {
    return (
        <div className="profile-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', background: 'var(--card-bg, #242526)', borderRadius: '12px', border: '1px solid var(--border-color, #393a3b)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img 
                    src={request.avatar?.startsWith('http') ? request.avatar : `/${request.avatar}`} 
                    alt={request.username} 
                    style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div>
                    <h4 style={{ margin: '0 0 4px 0', color: 'var(--profile-text-primary, #e4e6eb)' }}>{request.fullName || request.username}</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--profile-text-secondary, #b0b3b8)' }}>@{request.username}</p>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    onClick={() => onRespond(request.requestId, 'accepted')}
                >
                    <FaCheck /> Xác nhận
                </button>
                <button 
                    className="btn btn-danger" 
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    onClick={() => onRespond(request.requestId, 'rejected')}
                >
                    <FaTimes /> Xóa
                </button>
            </div>
        </div>
    );
};

export default RequestCard;