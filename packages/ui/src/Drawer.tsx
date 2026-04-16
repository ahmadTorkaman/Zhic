'use client';

import {
  useId,
  useRef,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { useDialogEffect } from './useDialogEffect';
import { useIsClient } from './useIsClient';

type Side = 'start' | 'end' | 'top' | 'bottom' | 'full';
type Size = 'sm' | 'md' | 'lg';

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  side?: Side;
  size?: Size;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
};

const PANEL_POSITION: Record<Side, string> = {
  start: 'absolute start-0 inset-y-0',
  end: 'absolute end-0 inset-y-0',
  top: 'absolute top-0 inset-x-0',
  bottom: 'absolute bottom-0 inset-x-0',
  full: 'absolute inset-0',
};

const PANEL_SIZE: Record<Side, Record<Size, string>> = {
  start: {
    sm: 'h-full w-full max-w-xs',
    md: 'h-full w-full max-w-sm',
    lg: 'h-full w-full max-w-md',
  },
  end: {
    sm: 'h-full w-full max-w-xs',
    md: 'h-full w-full max-w-sm',
    lg: 'h-full w-full max-w-md',
  },
  top: {
    sm: 'w-full h-[40vh]',
    md: 'w-full h-[60vh]',
    lg: 'w-full h-[80vh]',
  },
  bottom: {
    sm: 'w-full h-[40vh]',
    md: 'w-full h-[60vh]',
    lg: 'w-full h-[80vh]',
  },
  full: {
    sm: 'h-full w-full',
    md: 'h-full w-full',
    lg: 'h-full w-full',
  },
};

export function Drawer({
  open,
  onClose,
  side = 'start',
  size = 'md',
  title,
  description,
  children,
  footer,
  closeLabel = 'بستن',
  className,
}: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isClient = useIsClient();
  const titleId = useId();
  const descriptionId = useId();

  useDialogEffect(dialogRef, open, onClose);

  if (!isClient) return null;

  const handleBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      onClick={handleBackdrop}
      onCancel={handleCancel}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      className={cn(
        'fixed inset-0 m-0 h-screen max-h-none w-screen max-w-none bg-transparent p-0 outline-none',
        '[&::backdrop]:bg-ink/60',
      )}
    >
      <div
        className={cn(
          'flex flex-col bg-ivory text-charcoal shadow-modal',
          PANEL_POSITION[side],
          PANEL_SIZE[side][size],
          className,
        )}
      >
        {title || description ? (
          <header className="flex items-start justify-between gap-4 border-b border-sand p-5">
            <div className="space-y-1">
              {title ? (
                <h2 id={titleId} className="text-h4 font-bold">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p id={descriptionId} className="text-small text-stone">
                  {description}
                </p>
              ) : null}
            </div>
            <CloseButton onClick={onClose} label={closeLabel} />
          </header>
        ) : (
          <div className="absolute end-3 top-3 z-10">
            <CloseButton onClick={onClose} label={closeLabel} />
          </div>
        )}
        <div className="grow overflow-y-auto p-5">{children}</div>
        {footer ? (
          <footer className="border-t border-sand p-5">{footer}</footer>
        ) : null}
      </div>
    </dialog>,
    document.body,
  );
}

function CloseButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-stone hover:bg-sand/60 hover:text-charcoal focus-visible:outline-none"
    >
      <svg
        viewBox="0 0 14 14"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M1 1 L13 13 M13 1 L1 13" strokeLinecap="round" />
      </svg>
    </button>
  );
}
