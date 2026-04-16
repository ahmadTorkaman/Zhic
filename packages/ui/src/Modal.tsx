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

type Size = 'sm' | 'md' | 'lg';

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  size?: Size;
  children?: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'w-full max-w-sm',
  md: 'w-full max-w-md',
  lg: 'w-full max-w-lg',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
  closeLabel = 'بستن',
  className,
}: ModalProps) {
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
        'm-auto bg-transparent p-0 outline-none',
        '[&::backdrop]:bg-ink/60 [&::backdrop]:backdrop-blur-sm',
      )}
    >
      <div
        className={cn(
          'relative flex max-h-[90vh] flex-col overflow-hidden rounded-md bg-ivory text-charcoal shadow-modal',
          SIZE_CLASSES[size],
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
