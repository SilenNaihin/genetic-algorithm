'use client';

import { useState, useCallback, ReactNode } from 'react';

interface AccordionSection {
  id: string;
  title: string;
  content: ReactNode;
}

interface CollapsibleAccordionProps {
  sections: AccordionSection[];
  defaultOpen?: string;
}

/**
 * Accordion component where only one section can be open at a time.
 * When one section opens, others auto-close with animation.
 */
export function CollapsibleAccordion({ sections, defaultOpen }: CollapsibleAccordionProps) {
  const [openSection, setOpenSection] = useState<string | null>(defaultOpen ?? sections[0]?.id ?? null);

  const toggleSection = useCallback((id: string) => {
    setOpenSection(prev => prev === id ? null : id);
  }, []);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {sections.map(section => (
        <div
          key={section.id}
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            border: '1px solid var(--border-light)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <button
            onClick={() => toggleSection(section.id)}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            <span>{section.title}</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{
                transform: openSection === section.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {/* Content with animation */}
          <div
            style={{
              maxHeight: openSection === section.id ? '1000px' : '0px',
              overflow: 'hidden',
              transition: 'max-height 0.3s ease-in-out',
            }}
          >
            <div style={{
              padding: '0 16px 12px 16px',
              borderTop: '1px solid var(--border)',
            }}>
              {section.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default CollapsibleAccordion;
