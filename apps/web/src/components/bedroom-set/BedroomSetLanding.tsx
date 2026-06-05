'use client';

import * as React from 'react';
import type { DesignCard, FeaturedPage, WritingContent } from './placeholder-data';
import { DesignCarousel } from './DesignCarousel';
import { WritingSection } from './WritingSection';
import { FeaturedOverlay } from './FeaturedOverlay';
import { Toast } from './Toast';
import './bedroom-set.css';

type View = 'designs' | 'featured';

export function BedroomSetLanding({
  designs,
  pages,
  writing,
}: {
  designs: DesignCard[];
  pages: FeaturedPage[];
  writing: WritingContent;
}) {
  const [view, setView] = React.useState<View>('designs');
  const [toast, setToast] = React.useState({ text: '', show: false });
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const viewRef = React.useRef(view);
  React.useEffect(() => { viewRef.current = view; }, [view]);

  const showToast = React.useCallback((text: string) => {
    setToast({ text, show: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 1300);
  }, []);

  const openFeatured = React.useCallback(() => setView('featured'), []);
  const closeFeatured = React.useCallback(() => setView('designs'), []);
  const onOpenDesign = React.useCallback(
    (d: DesignCard) => showToast(`باز کردن طرح ${d.name} →`),
    [showToast],
  );
  const onOpenProduct = React.useCallback(() => showToast('مشاهده →'), [showToast]);

  // Swipe up once scrolled to the bottom (the writing section) → open featured.
  React.useEffect(() => {
    let wY = 0;
    const onStart = (e: TouchEvent) => { wY = e.touches[0]?.clientY ?? 0; };
    const onEnd = (e: TouchEvent) => {
      if (viewRef.current !== 'designs') return;
      const dy = (e.changedTouches[0]?.clientY ?? 0) - wY;
      const atBottom =
        Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 4;
      if (dy < -48 && atBottom) openFeatured();
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, [openFeatured]);

  React.useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  return (
    <>
      <DesignCarousel designs={designs} view={view} onOpenDesign={onOpenDesign} />
      <WritingSection content={writing} onOpenFeatured={openFeatured} />
      <FeaturedOverlay pages={pages} view={view} onClose={closeFeatured} onOpenProduct={onOpenProduct} />
      <Toast text={toast.text} show={toast.show} />
    </>
  );
}
