'use client';

import * as React from 'react';
import { splitTitleWords } from './headline';

// Ported from the mockup's buildHeadline/setHeadline. React renders an empty
// container; this effect owns its children entirely (it never conflicts with
// React reconciliation because the JSX has no children).
export function RotatingHeadline({ title, active = false }: { title: string; active?: boolean }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = React.useRef(active);
  React.useEffect(() => { activeRef.current = active; }, [active]);

  React.useEffect(() => {
    const fhead = ref.current;
    if (!fhead) return;

    const build = (t: string) => {
      fhead.textContent = '';
      fhead.setAttribute('aria-label', t);
      const els: HTMLSpanElement[] = [];
      const words = splitTitleWords(t);
      words.forEach((w, wi) => {
        const wo = document.createElement('span');
        wo.className = 'zh-bs-rt-word'; // whole word = one unit → Persian joins intact
        const e = document.createElement('span');
        e.className = 'zh-bs-rt-el';
        e.textContent = w;
        wo.appendChild(e);
        els.push(e);
        fhead.appendChild(wo);
        if (wi < words.length - 1) {
          const sp = document.createElement('span');
          sp.className = 'zh-bs-rt-space';
          sp.textContent = ' ';
          fhead.appendChild(sp);
        }
      });
      els.forEach((e, idx) => { e.style.transitionDelay = `${idx * 70}ms`; });
      if (activeRef.current) {
        requestAnimationFrame(() =>
          requestAnimationFrame(() => els.forEach((e) => e.classList.add('in'))),
        );
      }
    };

    const old = Array.from(fhead.querySelectorAll<HTMLSpanElement>('.zh-bs-rt-el'));
    if (old.length) {
      // Replace: exit current words upward, then build the next.
      old.forEach((e, idx) => {
        e.style.transitionDelay = `${idx * 55}ms`;
        e.classList.remove('in');
        e.classList.add('out');
      });
      timerRef.current = setTimeout(() => build(title), 430);
    } else {
      build(title);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [title]);

  // Play (on open) / reset (on close) the entrance for the current words. The
  // mockup animates the headline inside openFeatured(); because we SSR the
  // content, we trigger on `active` (the overlay opening) instead of on mount.
  React.useEffect(() => {
    const fhead = ref.current;
    if (!fhead) return;
    const els = Array.from(fhead.querySelectorAll<HTMLSpanElement>('.zh-bs-rt-el'));
    if (active) {
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => els.forEach((e) => e.classList.add('in'))),
      );
      return () => cancelAnimationFrame(id);
    }
    els.forEach((e) => e.classList.remove('in'));
  }, [active]);

  return <div ref={ref} className="zh-bs-fhead" aria-label={title} />;
}
