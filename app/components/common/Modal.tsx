'use client';

import { type ReactNode, useEffect, useCallback } from 'react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

/**
 * Modal component with overlay
 *
 * Uses existing .modal-overlay, .modal-content, .modal-header, .modal-body classes
 * from main.css for visual parity during migration.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className = '',
  maxWidth = '600px',
}: ModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Close when clicking overlay (not content)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`modal-overlay visible ${className}`}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="modal-content" style={{ maxWidth, width: '90vw' }}>
        {title && (
          <div className="modal-header">
            <span id="modal-title" className="modal-title">
              {title}
            </span>
            <Button variant="icon" onClick={onClose} aria-label="Close modal">
              &times;
            </Button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
