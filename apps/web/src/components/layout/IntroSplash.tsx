'use client';

import { useEffect, useState } from 'react';
import './intro-splash.css';

// Light logo-motion GIF: 760×480, ~3.24s for one play (it loops, so we time
// the fade to one play length).
const PLAY_MS = 3240;
const FADE_MS = 700;

/**
 * One-time intro: covers the page, plays the logo-motion GIF once, fades, and
 * reveals the site. Shown once per browser session (sessionStorage) and skipped
 * for `prefers-reduced-motion` — both handled by the blocking head script that
 * adds `.intro-seen` to <html> before first paint, so returning-in-session
 * visitors never see a flash. The overlay is in the SSR markup so first-time
 * visitors don't see the page before the splash.
 */
export function IntroSplash() {
  const [phase, setPhase] = useState<'play' | 'fade' | 'done'>('play');

  useEffect(() => {
    // Already-seen / reduced-motion: the head script flagged <html>. Bail.
    if (document.documentElement.classList.contains('intro-seen')) {
      setPhase('done');
      return;
    }
    document.body.style.overflow = 'hidden';
    const t1 = setTimeout(() => setPhase('fade'), PLAY_MS);
    const t2 = setTimeout(() => {
      setPhase('done');
      try { sessionStorage.setItem('zhic-intro', '1'); } catch { /* private mode */ }
      document.documentElement.classList.add('intro-seen');
      document.body.style.overflow = '';
    }, PLAY_MS + FADE_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      document.body.style.overflow = '';
    };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={`zh-intro${phase === 'fade' ? ' is-fading' : ''}`} aria-hidden>
      <img src="/intro/zhic-logo-motion-light.gif" alt="" className="zh-intro__gif" />
    </div>
  );
}
