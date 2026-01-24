'use client';

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface SettingsPopoverProps {
  children: ReactNode;
  width?: number;
}

interface PopoverPosition {
  top: number;
  left: number;
  arrowLeft: number;
  showAbove: boolean;
}

/**
 * Gear icon that opens a popover with settings.
 * Reusable component for inline settings that would otherwise take too much space.
 */
export function SettingsPopover({ children, width = 220 }: SettingsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);
  const iconRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!iconRef.current || !popoverRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const popoverHeight = popoverRect.height || 150;
    const arrowSize = 8;
    const gap = 4;

    // Center the popover horizontally on the icon
    const iconCenterX = iconRect.left + iconRect.width / 2;
    let left = iconCenterX - width / 2;

    // Keep within viewport horizontally
    const margin = 10;
    if (left < margin) left = margin;
    if (left + width > window.innerWidth - margin) {
      left = window.innerWidth - width - margin;
    }

    // Arrow points to the icon center
    const arrowLeft = Math.max(12, Math.min(width - 12, iconCenterX - left));

    // Determine if we should show above or below
    const spaceBelow = window.innerHeight - iconRect.bottom;
    const spaceAbove = iconRect.top;
    const showAbove = spaceBelow < popoverHeight + arrowSize + gap + margin && spaceAbove > spaceBelow;

    let top: number;
    if (showAbove) {
      top = iconRect.top - popoverHeight - arrowSize - gap;
    } else {
      top = iconRect.bottom + arrowSize + gap;
    }

    setPosition({ top, left, arrowLeft, showAbove });
  }, [width]);

  // Calculate position when opening and on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    // Initial calculation after render
    requestAnimationFrame(calculatePosition);

    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);

    // Watch for content size changes
    const observer = new ResizeObserver(calculatePosition);
    if (popoverRef.current) {
      observer.observe(popoverRef.current);
    }

    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
      observer.disconnect();
    };
  }, [isOpen, calculatePosition]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      <button
        ref={iconRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          padding: '2px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpen ? 'var(--accent)' : 'var(--text-muted)',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.color = 'var(--text-muted)';
        }}
        title="Settings"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: position?.top ?? -9999,
            left: position?.left ?? -9999,
            width,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            padding: '12px',
            zIndex: 10000,
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          {/* Arrow pointing to the icon */}
          {position && (
            <div
              style={{
                position: 'absolute',
                left: position.arrowLeft - 6,
                ...(position.showAbove
                  ? { bottom: -6, borderTop: '6px solid var(--bg-secondary)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent' }
                  : { top: -6, borderBottom: '6px solid var(--bg-secondary)', borderLeft: '6px solid transparent', borderRight: '6px solid transparent' }
                ),
                width: 0,
                height: 0,
              }}
            />
          )}
          {children}
        </div>,
        document.body
      )}
    </>
  );
}

export default SettingsPopover;
