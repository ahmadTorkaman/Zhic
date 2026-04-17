'use client';

import {
  useId,
  useRef,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { CloseButton } from './internal/CloseButton';
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

const SLIDE_IN: Record<Side, string> = {
  start: 'drawer-slide-in-start',
  end: 'drawer-slide-in-end',
  top: 'drawer-slide-in-top',
  bottom: 'drawer-slide-in-bottom',
  full: 'drawer-fade-in',
};

const SLIDE_OUT: Record<Side, string> = {
  start: 'drawer-slide-out-start',
  end: 'drawer-slide-out-end',
  top: 'drawer-slide-out-top',
  bottom: 'drawer-slide-out-bottom',
  full: 'drawer-fade-out',
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

  const { closing } = useDialogEffect(dialogRef, open, onClose, { animated: true });

  if (!isClient) return null;

  const handleBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  const panelAnimation: CSSProperties = {
    animation: closing
      ? `${SLIDE_OUT[side]} 480ms var(--ease-in-soft) both`
      : `${SLIDE_IN[side]} var(--dur-dialog) var(--ease-out-soft) both`,
  };

  return createPortal(
    <dialog
      ref={dialogRef}
      onClick={handleBackdrop}
      onCancel={handleCancel}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      className={cn(
        'fixed inset-0 m-0 h-screen max-h-none w-screen max-w-none bg-transparent p-0 outline-none',
        '[&::backdrop]:bg-transparent',
      )}
    >
      <div className="drawer-overlay absolute inset-0 bg-ink/60" aria-hidden />
      <div
        className={cn(
          'drawer-panel flex flex-col bg-ivory text-charcoal shadow-modal',
          PANEL_POSITION[side],
          PANEL_SIZE[side][size],
          className,
        )}
        style={panelAnimation}
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
