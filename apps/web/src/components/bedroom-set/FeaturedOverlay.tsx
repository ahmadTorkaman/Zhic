'use client';

import * as React from 'react';
import type { FeaturedPage } from './placeholder-data';
import { RotatingHeadline } from './RotatingHeadline';

type View = 'designs' | 'featured';

function FeaturedGrid({ page, open, onOpenProduct }: { page: FeaturedPage; open: boolean; onOpenProduct: (href?: string) => void }) {
  const tiles = [{ tile: page.hero, hero: true }, ...page.row.map((t) => ({ tile: t, hero: false }))];
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Play the rise-in when the overlay is open; reset it while closed. The grid
  // remounts per page (key={page}), so page-to-page changes replay it too.
  React.useEffect(() => {
    const els = refs.current.filter(Boolean) as HTMLButtonElement[];
    els.forEach((el, idx) => { el.style.transitionDelay = `${idx * 90}ms`; });
    if (!open) { els.forEach((el) => el.classList.remove('in')); return; }
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => els.forEach((el) => el.classList.add('in'))),
    );
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div className="zh-bs-grid">
      {tiles.map(({ tile, hero }, idx) => (
        <button
          key={idx}
          type="button"
          className={`zh-bs-tile${hero ? ' hero' : ''}`}
          ref={(el) => { refs.current[idx] = el; }}
          onClick={() => onOpenProduct(tile.href)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 1:1 parity; SP1 swaps to PayloadImage */}
          <img src={tile.src} alt={tile.alt} />
        </button>
      ))}
    </div>
  );
}

export function FeaturedOverlay({
  pages,
  view,
  onClose,
  onOpenProduct,
}: {
  pages: FeaturedPage[];
  view: View;
  onClose: () => void;
  onOpenProduct: (href?: string) => void;
}) {
  const rootRef = React.useRef<HTMLElement | null>(null);
  const viewRef = React.useRef(view);
  const [page, setPage] = React.useState(0);
  const open = view === 'featured';

  React.useEffect(() => { viewRef.current = view; }, [view]);
  React.useEffect(() => { if (open) setPage(0); }, [open]);

  const next = React.useCallback(() => setPage((p) => Math.min(pages.length - 1, p + 1)), [pages.length]);
  const prev = React.useCallback(() => {
    if (page > 0) setPage((p) => p - 1);
    else onClose();
  }, [page, onClose]);

  // touch paging
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let tY = 0;
    const onStart = (e: TouchEvent) => { tY = e.touches[0]?.clientY ?? 0; };
    const onEnd = (e: TouchEvent) => {
      const dy = (e.changedTouches[0]?.clientY ?? 0) - tY;
      if (dy < -50) next();
      else if (dy > 50) prev();
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend', onEnd);
    };
  }, [next, prev]);

  // wheel paging (debounced)
  React.useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let fw: ReturnType<typeof setTimeout> | null = null;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (fw || Math.abs(e.deltaY) < 12) return;
      if (e.deltaY > 0) next();
      else prev();
      fw = setTimeout(() => { fw = null; }, 480);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      if (fw) clearTimeout(fw);
    };
  }, [next, prev]);

  // keyboard (featured view only)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewRef.current !== 'featured') return;
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      else if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
      else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  const cur = pages[page]!;

  return (
    <section
      className={`zh-bs-featured${open ? ' show' : ''}`}
      aria-hidden={!open}
      ref={rootRef}
    >
      <button className="zh-bs-fback" type="button" aria-label="بازگشت به طرح‌ها" onClick={prev}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9 L12 15 L18 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <RotatingHeadline title={cur.title} active={open} />
      {/* key={page} remounts the grid so the rise-in stagger replays per page */}
      <FeaturedGrid key={page} page={cur} open={open} onOpenProduct={onOpenProduct} />
      {/* Per-page caption under the grid (CMS: bedroom-set global per-page intro). */}
      {cur.intro ? <p className="zh-bs-fintro">{cur.intro}</p> : null}
      <div className="zh-bs-fdots" aria-hidden="true">
        {pages.map((_, i) => (
          <span key={i} className={`zh-bs-fdot${i === page ? ' on' : ''}`} />
        ))}
      </div>
    </section>
  );
}
