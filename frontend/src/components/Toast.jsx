import React, { useEffect } from 'react';
import './Toast.css';

/**
 * Toast Notification Component
 * Replaces blocking alert() calls
 */
const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        {type === 'error' && <span className="toast-icon">⚠️</span>}
        {type === 'success' && <span className="toast-icon">✅</span>}
        {type === 'warning' && <span className="toast-icon">💡</span>}
        {type === 'info' && <span className="toast-icon">ℹ️</span>}
        <span className="toast-message">{message}</span>
      </div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export default Toast;
