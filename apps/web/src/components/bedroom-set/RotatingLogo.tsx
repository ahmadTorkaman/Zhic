'use client';

import * as React from 'react';

// Mirrors RotatingHeadline's setHeadline exactly: the focused design's name-mark
// slides up and out, then — after a 430ms beat — the next one is built and slides
// in from below. The same sequential replace as the featured headline text.
export function RotatingLogo({ src }: { src: string | undefined }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    const box = ref.current;
    if (!box) return;

    const build = (s: string | undefined) => {
      box.textContent = '';
      if (!s) return;
      const img = document.createElement('img');
      img.className = 'zh-bs-lg';
      img.alt = '';
      img.src = s;
      box.appendChild(img);
      requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add('in')));
    };

    const old = box.querySelector('.zh-bs-lg');
    if (old) {
      old.classList.remove('in');
      old.classList.add('out'); // slide the current name-mark up and out
      timerRef.current = setTimeout(() => build(src), 430); // then bring the next in from below
    } else {
      build(src);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [src]);

  return <div ref={ref} className="zh-bs-flip" />;
}
