'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

let bodyLockCount = 0;
let originalBodyOverflow: string | null = null;

function lockBody() {
  if (bodyLockCount === 0) {
    originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  bodyLockCount += 1;
}

function unlockBody() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = originalBodyOverflow ?? '';
    originalBodyOverflow = null;
  }
}

export function useDialogEffect(
  dialogRef: RefObject<HTMLDialogElement | null>,
  open: boolean,
  onClose: () => void,
  options?: { animated?: boolean },
) {
  const lockedRef = useRef(false);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        previouslyFocusedRef.current =
          (document.activeElement as HTMLElement | null) ?? null;
        dialog.showModal();
        if (options?.animated) {
          dialog.dataset.state = 'open';
        }
        if (!lockedRef.current) {
          lockBody();
          lockedRef.current = true;
        }
      }
    } else if (dialog.open) {
      if (options?.animated) {
        setClosing(true);
        dialog.dataset.state = 'closing';

        let settled = false;

        const finish = () => {
          if (settled) return;
          settled = true;
          setClosing(false);
          dialog.close();
        };

        const handleAnimationEnd = () => {
          dialog.removeEventListener('animationend', handleAnimationEnd);
          clearTimeout(safetyTimer);
          finish();
        };

        const safetyTimer = setTimeout(() => {
          dialog.removeEventListener('animationend', handleAnimationEnd);
          finish();
        }, 700);

        dialog.addEventListener('animationend', handleAnimationEnd);
      } else {
        dialog.close();
      }
    }
  }, [dialogRef, open, options?.animated]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (lockedRef.current) {
        unlockBody();
        lockedRef.current = false;
      }
      const toRestore = previouslyFocusedRef.current;
      previouslyFocusedRef.current = null;
      if (toRestore && typeof toRestore.focus === 'function') {
        toRestore.focus();
      }
      onCloseRef.current();
    };

    dialog.addEventListener('close', handleClose);
    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [dialogRef]);

  useEffect(() => {
    return () => {
      if (lockedRef.current) {
        unlockBody();
        lockedRef.current = false;
      }
    };
  }, []);

  return { closing };
}
