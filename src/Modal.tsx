import React from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

export default function Modal({ open, onClose, children, ariaLabel }: ModalProps) {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-label={ariaLabel || 'Dialog'}>
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} aria-label="Close" onClick={onClose}>&times;</button>
        {children}
      </div>
    </div>
  );
}
