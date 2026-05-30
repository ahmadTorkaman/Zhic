'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PayloadDesign } from '@/lib/payload';
import './designs-slider.css';

export type DesignsSliderProps = {
  designs: PayloadDesign[];
};

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toPersian = (n: number | string) =>
  String(n).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);

/** Persian labels for the four occupancy hubs the chip row links to. */
const OCCUPANCY_CHIP_LABEL: Record<
  NonNullable<PayloadDesign['occupancies']>[number],
  string
> = {
  baby: 'نوزاد',
  teen: 'نوجوان',
  double: 'دونفره',
  bunk: 'دوطبقه',
};

/** Canonical render order for the occupancy cards (age ascending → bunk last)
 *  so different designs surface their cards consistently regardless of how
 *  Payload stored the array. */
const OCCUPANCY_ORDER: NonNullable<PayloadDesign['occupancies']> = [
  'baby',
  'teen',
  'double',
  'bunk',
];

function getEyebrow(d: PayloadDesign): string {
  switch (d.age_group) {
    case 'infant':
    case 'child':
      return 'طرح ژیک · سرویس کودک';
    case 'teen':
      return 'طرح ژیک · سرویس نوجوان';
    case 'adult':
    default:
      return 'طرح ژیک · سرویس بزرگسال';
  }
}

function getMediaUrl(d: PayloadDesign): string | undefined {
  return d.heroMedia?.url ?? d.sliderMedia?.url ?? d.gallery?.[0]?.url ?? undefined;
}

function getMediaMime(d: PayloadDesign): string | undefined {
  return (
    d.heroMedia?.mimeType ??
    d.sliderMedia?.mimeType ??
    d.gallery?.[0]?.mimeType ??
    undefined
  );
}

export function DesignsSlider({ designs }: DesignsSliderProps) {
  if (!designs?.length) {
    return (
      <div className="zh-designs-slider">
        <main className="zh-designs-stage" aria-label="گالری طرح‌های ژیک">
          <p
            style={{
              gridRow: '1 / -1',
              alignSelf: 'center',
              textAlign: 'center',
              color: 'var(--color-stone)',
            }}
          >
            به‌زودی طرح‌های ژیک به این صفحه اضافه می‌شوند.
          </p>
        </main>
      </div>
    );
  }
  return <Slider designs={designs} />;
}

// SVG design silhouette used when a design has no uploaded media.
// Matches the v14 mockup: neutral mid-gray pieces on the ivory stage.
function SvgPlaceholder() {
  const tone = '#9A9A9A';
  const shadow = '#4A4A4A';
  return (
    <svg viewBox="0 0 720 380" aria-hidden role="img">
      <g transform="translate(40 60)">
        <rect x="0" y="0" width="110" height="260" rx="6" fill={tone} />
      </g>
      <g transform="translate(170 200)">
        <rect x="0" y="0" width="140" height="120" rx="5" fill={tone} />
      </g>
      <g transform="translate(330 130)">
        <rect x="0" y="0" width="320" height="80" rx="4" fill={tone} />
        <rect x="20" y="80" width="280" height="50" rx="6" fill={shadow} opacity="0.25" />
        <rect x="30" y="84" width="260" height="42" rx="4" fill="#FFFFFF" opacity="0.85" />
        <rect x="0" y="130" width="320" height="22" rx="3" fill={tone} />
      </g>
      <g transform="translate(670 220)">
        <rect x="0" y="0" width="40" height="100" rx="3" fill={tone} />
      </g>
      <ellipse cx="380" cy="345" rx="320" ry="12" fill={shadow} opacity="0.10" />
    </svg>
  );
}

// Split a string into per-word spans so the [data-state="entering"] CSS
// fires the per-word blur stagger via calc(var(--i) * 70ms).
function staggeredWords(text: string): React.ReactNode {
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((w, i) => (
    <React.Fragment key={i}>
      <span className="zh-designs-word" style={{ ['--i' as never]: i }}>
        {w}
      </span>
      {i < words.length - 1 ? ' ' : null}
    </React.Fragment>
  ));
}

function Slider({ designs }: { designs: PayloadDesign[] }) {
  const N = designs.length;

  // progress is React state (sync with React tree); progressRef shadows it
  // so event handlers + animation loops can read the current value without
  // depending on closure capture.
  const router = useRouter();
  const [progress, setProgress] = React.useState(0);
  const [isScrubbing, setIsScrubbing] = React.useState(false);
  const [focused, setFocused] = React.useState(0);
  const [promptHidden, setPromptHidden] = React.useState(false);

  const progressRef = React.useRef(0);
  const isScrubbingRef = React.useRef(false);
  const promptHiddenRef = React.useRef(false);
  React.useLayoutEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  React.useLayoutEffect(() => {
    isScrubbingRef.current = isScrubbing;
  }, [isScrubbing]);
  React.useLayoutEffect(() => {
    promptHiddenRef.current = promptHidden;
  }, [promptHidden]);

  // DOM refs
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  // True if the user crossed the 8px touch threshold during the current
  // gesture — distinguishes a real swipe (skip click) from a tap (navigate).
  // isScrubbing alone can't do this: it goes true on every touchstart, so
  // pure taps would always be classified as drags.
  const draggedRef = React.useRef(false);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const textRef = React.useRef<HTMLDivElement | null>(null);

  // Animation refs
  const snapTimerRef = React.useRef<number | null>(null);
  const snapAnimRef = React.useRef<number | null>(null);

  // Imperative render — recompute every card's transform/opacity/filter from
  // progressRef + isScrubbingRef. Called on every progress/isScrubbing tick
  // AND on resize (to recompute the slot width).
  const render = React.useCallback(() => {
    const vp = progressRef.current;
    const cards = cardRefs.current;
    const first = cards[0];
    if (!first) return;

    const cardRect = first.getBoundingClientRect();
    const cardW = cardRect.width;
    const vw = window.innerWidth;
    const gap7vw = vw * 0.07;
    const gapPx = vw < 768
      ? Math.min(56, Math.max(28, gap7vw))
      : Math.min(110, Math.max(48, gap7vw));
    const slot = cardW + gapPx;

    const scrubbing = isScrubbingRef.current;
    const blurMult = scrubbing ? 1.0 : 1.8;

    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      if (!c) continue;
      const dist = i - vp;
      const absDist = Math.abs(dist);
      const offsetX = -dist * slot;
      const scale = Math.max(0.28, 1.22 - absDist * 0.34);
      const opacity = absDist > 1 ? 0 : Math.max(0.15, 1 - absDist * 0.32);
      const blur = Math.min(22, absDist * 6 * blurMult);
      c.style.transform = `translate(-50%, -50%) translateX(${offsetX.toFixed(1)}px) scale(${scale.toFixed(3)})`;
      c.style.opacity = opacity.toFixed(3);
      c.style.filter = `blur(${blur.toFixed(2)}px)`;
      c.style.zIndex = String(Math.round(100 - absDist * 10));
    }

    // Focused index changes drive the text-swap animation
    const nearest = Math.max(0, Math.min(N - 1, Math.round(vp)));
    setFocused((prev) => (prev === nearest ? prev : nearest));

    // Scroll prompt hides once the user has actually advanced
    const wantHidden = vp > 0.15;
    if (wantHidden !== promptHiddenRef.current) {
      promptHiddenRef.current = wantHidden;
      setPromptHidden(wantHidden);
    }
  }, [N]);

  // Run render on every progress / isScrubbing change + after first mount.
  React.useLayoutEffect(() => {
    render();
  }, [progress, isScrubbing, render]);

  // Trigger text re-enter animation whenever focused changes. Forced reflow
  // between leaving → entering re-arms the [data-state="entering"] selectors
  // so the per-word stagger + name dia-shine + CTA delay fire again.
  React.useEffect(() => {
    const text = textRef.current;
    if (!text) return;
    text.dataset.state = 'leaving';
    void text.offsetWidth;
    text.dataset.state = 'entering';
  }, [focused]);

  // animateTo — smooth snap to a target index using ease-out-quint.
  const animateTo = React.useCallback((target: number) => {
    if (snapAnimRef.current !== null) {
      cancelAnimationFrame(snapAnimRef.current);
      snapAnimRef.current = null;
    }
    const from = progressRef.current;
    const distance = target - from;
    const duration = Math.min(700, Math.max(300, Math.abs(distance) * 600));
    const startTime = performance.now();
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
    setIsScrubbing(true);
    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const newP = from + distance * easeOutQuint(t);
      progressRef.current = newP;
      setProgress(newP);
      if (t < 1) {
        snapAnimRef.current = requestAnimationFrame(tick);
      } else {
        snapAnimRef.current = null;
        setIsScrubbing(false);
      }
    };
    snapAnimRef.current = requestAnimationFrame(tick);
  }, []);

  const scheduleSnap = React.useCallback(() => {
    if (snapTimerRef.current !== null) {
      clearTimeout(snapTimerRef.current);
    }
    snapTimerRef.current = window.setTimeout(() => {
      const target = Math.max(0, Math.min(N - 1, Math.round(progressRef.current)));
      animateTo(target);
    }, 180);
  }, [N, animateTo]);

  // (Body-scroll lock + wheel-scrub removed: the slider now sits in normal
  // page flow as a one-viewport-tall section so the user can scroll past it
  // to content beneath. Carousel navigation: touch swipe, dots, keyboard.)

  // Touch input — horizontal swipe drives virtualProgress directly (no
  // velocity decay; release triggers scheduleSnap). Swipe RIGHT advances.
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartProgress = 0;
    let touchAxis: 'h' | 'v' | null = null;
    const TOUCH_SENSITIVITY = 220;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartProgress = progressRef.current;
      touchAxis = null;
      draggedRef.current = false; // reset for the new gesture
      setIsScrubbing(true);
      if (snapAnimRef.current !== null) {
        cancelAnimationFrame(snapAnimRef.current);
        snapAnimRef.current = null;
      }
    };
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (touchAxis === null) {
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          touchAxis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
          draggedRef.current = true; // a real drag, not a tap
        }
      }
      e.preventDefault();
      const drive = dx;
      const newP = Math.max(
        0,
        Math.min(N - 1, touchStartProgress + drive / TOUCH_SENSITIVITY),
      );
      progressRef.current = newP;
      setProgress(newP);
    };
    const onEnd = () => {
      scheduleSnap();
      touchAxis = null;
    };
    stage.addEventListener('touchstart', onStart, { passive: true });
    stage.addEventListener('touchmove', onMove, { passive: false });
    stage.addEventListener('touchend', onEnd);
    return () => {
      stage.removeEventListener('touchstart', onStart);
      stage.removeEventListener('touchmove', onMove);
      stage.removeEventListener('touchend', onEnd);
    };
  }, [N, scheduleSnap]);

  // Keyboard — ArrowRight/Up/PageUp = next, ArrowLeft/Down/PageDown/Space = prev.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        animateTo(Math.min(N - 1, Math.round(progressRef.current) + 1));
      } else if (
        e.key === 'ArrowLeft' ||
        e.key === 'ArrowDown' ||
        e.key === 'PageDown' ||
        e.key === ' '
      ) {
        e.preventDefault();
        animateTo(Math.max(0, Math.round(progressRef.current) - 1));
      } else if (e.key === 'Home') {
        e.preventDefault();
        animateTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        animateTo(N - 1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [N, animateTo]);

  // Re-render card geometry on viewport resize.
  React.useEffect(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [render]);

  const focusedDesign = designs[focused] ?? designs[0]!;
  const focusedSlug = focusedDesign.slug ?? '';
  const focusedTagline = (focusedDesign.tagline ?? '').trim();

  return (
    <div className="zh-designs-slider">
      <main
        ref={stageRef}
        className="zh-designs-stage"
        aria-label="گالری طرح‌های ژیک"
        onClick={(e) => {
          // Skip if this gesture was a swipe, not a tap.
          if (draggedRef.current) return;
          // Don't swallow clicks on real interactive children (dots, links,
          // CTA buttons — they own their own behavior).
          if ((e.target as HTMLElement).closest('a, button')) return;
          if (focusedSlug) {
            router.push(`/bedroom-set/${encodeURIComponent(focusedSlug)}`);
          }
        }}
      >
        <div className="zh-designs-top">
          <nav className="zh-designs-breadcrumb" aria-label="مسیر">
            <Link href="/">خانه</Link> / طرح‌ها
          </nav>
          <div
            className="zh-designs-dots"
            role="tablist"
            aria-label="گزینش طرح"
          >
            {designs.map((d, i) => (
              <button
                key={String(d.id)}
                type="button"
                className={`zh-designs-dot${i === focused ? ' is-active' : ''}`}
                role="tab"
                aria-selected={i === focused}
                aria-label={`طرح ${d.name}`}
                onClick={() => animateTo(i)}
              />
            ))}
          </div>
          <div className="zh-designs-skip">
            <Link href="/bedroom-furniture">همه‌ی محصولات</Link>
          </div>
        </div>

        <div className="zh-designs-filmstrip" aria-label="فیلم‌نوار طرح‌ها">
          <div className="zh-designs-track">
            <div
              className="zh-designs-pedestal"
              data-visible={isScrubbing ? 'false' : 'true'}
              aria-hidden
            />
            {designs.map((d, i) => {
              const mediaUrl = getMediaUrl(d);
              const mime = getMediaMime(d);
              return (
                <div
                  key={String(d.id)}
                  ref={(el) => {
                    cardRefs.current[i] = el;
                  }}
                  className="zh-designs-card"
                  data-i={i}
                >
                  {mediaUrl ? (
                    mime?.startsWith('video/') ? (
                      <video
                        src={mediaUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt=""
                        loading={i === focused ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    )
                  ) : (
                    <SvgPlaceholder />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div ref={textRef} className="zh-designs-text" data-state="entering">
          <div className="zh-designs-text-top">
            <div className="zh-designs-name">
              <span className="zh-designs-name-shine">{focusedDesign.name}</span>
            </div>
            <div className="zh-designs-tagline">
              {focusedTagline ? staggeredWords(focusedTagline) : null}
            </div>
          </div>
          {/* Occupancy cards — positioned beneath the focused card. Surfaces
              designs that span more than one set type (e.g. an adult design
              that also has a teen version). Each card links to the matching
              /bedroom-set/{occupancy} hub. Suppressed when the design has
              0–1 entries (nothing to "also" with). */}
          {(focusedDesign.occupancies?.length ?? 0) > 1 ? (
            <div className="zh-designs-text-bottom">
              <div className="zh-designs-occupancy-cards">
                {[...focusedDesign.occupancies!]
                  .sort(
                    (a, b) =>
                      OCCUPANCY_ORDER.indexOf(a) - OCCUPANCY_ORDER.indexOf(b),
                  )
                  .map((o, i) => (
                    <Link
                      key={o}
                      // Within-design filter: navigates to this design's PDP
                      // narrowed to the chosen occupancy via ?age=. The PDP
                      // reads searchParams and passes the filter to Payload.
                      href={`/bedroom-set/${encodeURIComponent(focusedSlug)}?age=${o}`}
                      className="zh-designs-occupancy-card"
                      style={{ ['--i' as never]: i }}
                    >
                      <span className="zh-designs-occupancy-card__label">سرویس</span>
                      <span className="zh-designs-occupancy-card__name">{OCCUPANCY_CHIP_LABEL[o]}</span>
                    </Link>
                  ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="zh-designs-bottom">
          <div
            className="zh-designs-prompt"
            data-hidden={promptHidden ? 'true' : 'false'}
          >
            <svg
              className="zh-designs-prompt-arrow"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path
                d="M9 6L15 12L9 18"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>
              برای دیدن کلکسیون به راست اسکرول کنید · طرح{' '}
              {toPersian(focused + 1)} / {toPersian(N)}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
