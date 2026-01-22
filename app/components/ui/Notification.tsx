'use client';

import { useEffect } from 'react';
import { useEvolutionStore } from '../../stores/evolutionStore';

const AUTO_DISMISS_MS = 5000;

/**
 * Simple toast notification component.
 * Auto-dismisses after 5 seconds, click to dismiss immediately.
 */
export function Notification() {
  const notification = useEvolutionStore((s) => s.notification);
  const setNotification = useEvolutionStore((s) => s.setNotification);

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [notification, setNotification]);

  if (!notification) return null;

  const isError = notification.type === 'error';

  return (
    <div
      onClick={() => setNotification(null)}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        background: isError ? 'var(--danger, #dc2626)' : 'var(--bg-secondary)',
        color: isError ? '#fff' : 'var(--text-primary)',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        zIndex: 10000,
        fontSize: '14px',
        maxWidth: '400px',
        textAlign: 'center',
        animation: 'slideUp 0.2s ease-out',
      }}
    >
      {notification.message}
    </div>
  );
}

export default Notification;
