import { useState, useEffect } from 'react';
import styles from './Message.module.css';

const Message = ({ message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsHiding(false);

      // Auto hide after duration
      const timer = setTimeout(() => {
        startHiding();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration]);

  const startHiding = () => {
    setIsHiding(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300); // Match animation duration
  };

  const handleClose = () => {
    startHiding();
  };

  if (!isVisible || !message) return null;

  return (
    <div className={`${styles.message} ${styles[type]} ${isHiding ? styles.hiding : ''}`}>
      <div className={styles.messageContent}>
        <span className={styles.icon}>
          {type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
        </span>
        <span>{message}</span>
      </div>
      <button 
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close message"
      >
        ×
      </button>
      {!isHiding && <div className={styles.progressBar}></div>}
    </div>
  );
};

export default Message;