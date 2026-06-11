'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { DesignCard, FeaturedPage, Occupancy, WritingContent } from './placeholder-data';
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
  const router = useRouter();
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
    (d: DesignCard, occupancy: Occupancy | null) => {
      // The active room-type tab travels age-first: /bedroom-set/[age]/[series].
      if (d.slug) router.push(occupancy ? `/bedroom-set/${occupancy}/${d.slug}` : `/bedroom-set/${d.slug}`);
      else showToast(`باز کردن طرح ${d.name} →`);
    },
    [router, showToast],
  );
  const onOpenProduct = React.useCallback(
    (href?: string) => {
      if (href) router.push(href);
      else showToast('مشاهده →');
    },
    [router, showToast],
  );

  // Reaching the end of the writing section auto-raises the featured page (the
  // footer is hidden on this route, so the writing is the last thing in flow).
  // Re-arm only after scrolling well clear of the bottom, so closing the featured
  // — which leaves you at the bottom — doesn't instantly re-open it.
  React.useEffect(() => {
    let armed = false;
    const onScroll = () => {
      if (viewRef.current !== 'designs') return;
      const distFromBottom =
        document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      if (distFromBottom > 80) { armed = true; return; }
      if (distFromBottom <= 4 && armed) { armed = false; openFeatured(); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
