import React, { useEffect } from 'react';
import styles from './Alert.module.css'; // Adjust the import path as needed

const Alert = ({ message, onClose, type }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.alert} ${styles[type]}`}>
      <span>{message}</span>
      <button onClick={onClose} className={styles.closeButton}>X</button>
    </div>
  );
};

export default Alert;
