'use client';

import {
  cloneElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { useIsClient } from './useIsClient';

type Side = 'top' | 'bottom';

export type TooltipProps = {
  content: ReactNode;
  side?: Side;
  delay?: number;
  children: ReactElement;
  className?: string;
};

export function Tooltip({
  content,
  side = 'top',
  delay = 400,
  children,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tooltipId = useId();
  const isClient = useIsClient();

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const top = side === 'top' ? rect.top - 8 : rect.bottom + 8;
      const left = rect.left + rect.width / 2;
      setCoords({ top, left });
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  const trigger = cloneElement(children, {
    ref: triggerRef,
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  });

  if (!isClient) return trigger;

  return (
    <>
      {trigger}
      {open
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className={cn(
                'pointer-events-none fixed z-[var(--z-toast)]',
                'rounded-md bg-ink px-3 py-2 text-small text-ivory',
                'animate-[fade-in_var(--dur-base)_var(--ease-out-soft)_both]',
                side === 'top' ? '-translate-y-full' : '',
                '-translate-x-1/2',
                className,
              )}
              style={{ top: coords.top, left: coords.left }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
