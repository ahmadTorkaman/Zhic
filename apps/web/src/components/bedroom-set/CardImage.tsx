'use client';

import * as React from 'react';

// Keep in sync with the .zh-bs-dissolve duration in bedroom-set.css.
const DISSOLVE_MS = 500;

// A card banner that dissolves when its source changes: the incoming image is
// stacked over the current one and fades in (zh-bs-dissolve), then — once it is
// opaque — the layers beneath it are dropped. The first image (id 0) appears
// instantly; only later changes cross-dissolve, so swiping a card in never fades.
export function CardImage({ src, alt }: { src: string; alt: string }) {
  const [layers, setLayers] = React.useState<{ src: string; id: number }[]>(() => [{ src, id: 0 }]);
  const nextId = React.useRef(1);

  React.useEffect(() => {
    setLayers((ls) => (ls[ls.length - 1]?.src === src ? ls : [...ls, { src, id: nextId.current++ }]));
  }, [src]);

  // Drop the layers beneath the top once the fade has finished. A timer (rather
  // than onAnimationEnd) so it still fires under prefers-reduced-motion, where the
  // fade is disabled and no animationend event would arrive.
  React.useEffect(() => {
    if (layers.length < 2) return;
    const t = setTimeout(() => setLayers((ls) => ls.slice(-1)), DISSOLVE_MS + 40);
    return () => clearTimeout(t);
  }, [layers]);

  return (
    <>
      {layers.map((l) => (
        /* eslint-disable-next-line @next/next/no-img-element -- 1:1 parity; SP1 swaps to PayloadImage */
        <img
          key={l.id}
          src={l.src}
          alt={alt}
          className={l.id === 0 ? undefined : 'zh-bs-dissolve'}
        />
      ))}
    </>
  );
}
