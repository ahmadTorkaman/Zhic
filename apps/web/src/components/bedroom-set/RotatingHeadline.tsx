'use client';

import * as React from 'react';
import { splitTitleWords } from './headline';

// Ported from the mockup's buildHeadline/setHeadline. React renders an empty
// container; this effect owns its children entirely (it never conflicts with
// React reconciliation because the JSX has no children).
export function RotatingHeadline({ title }: { title: string }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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
      requestAnimationFrame(() =>
        requestAnimationFrame(() => els.forEach((e) => e.classList.add('in'))),
      );
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

  return <div ref={ref} className="zh-bs-fhead" aria-label={title} />;
}
