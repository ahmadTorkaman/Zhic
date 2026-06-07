'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './modal.css';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible dialog title (also rendered as the heading). */
  title: string;
  children: ReactNode;
};

/**
 * Minimal accessible modal: portal to <body>, dimmed backdrop, centered panel.
 * Esc and backdrop click close it; body scroll is locked and focus moves into
 * the panel while open. Mounts only when open (cheap, no SSR markup).
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="zh-modal"
      onMouseDown={(e) => {
        // Backdrop click (not a click that started inside the panel) closes.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="zh-modal__panel"
      >
        <button type="button" aria-label="بستن" onClick={onClose} className="zh-modal__close">
          <svg viewBox="0 0 14 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M1 1L13 13M13 1L1 13" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="zh-modal__title">{title}</h2>
        {children}
      </div>
    </div>,
    document.body,
  );
}
