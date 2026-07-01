'use client';

import * as React from 'react';
import type { WritingContent } from './placeholder-data';

const PHONE_QUERY = '(max-width: 768px)';
const COLLAPSE_LINES = 10;

// On phone, long writing copy is clamped to COLLAPSE_LINES and revealed with a
// smooth "read more" toggle. The clamp is decided after mount (progressive
// enhancement: without JS, or on desktop, the full text always renders), and
// the open/close is animated via an explicit max-height so it eases instead of
// snapping. SSR renders the full text, so it stays crawlable.
export function WritingSection({
  content,
  onOpenFeatured,
}: {
  content: WritingContent;
  onOpenFeatured: () => void;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const bodyRef = React.useRef<HTMLParagraphElement>(null);
  const [collapsible, setCollapsible] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [maxHeight, setMaxHeight] = React.useState<string | undefined>(undefined);

  const collapsedHeight = React.useCallback(() => {
    const body = bodyRef.current;
    if (!body) return 0;
    const lh = parseFloat(getComputedStyle(body).lineHeight) || 0;
    return lh * COLLAPSE_LINES;
  }, []);

  // Decide whether the copy overflows COLLAPSE_LINES on phone; keep the collapsed
  // height in sync on resize / copy change. Skips while expanded (height is auto).
  React.useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const measure = () => {
      const onPhone = window.matchMedia(PHONE_QUERY).matches;
      const collapsedH = collapsedHeight();
      const overflows = onPhone && body.scrollHeight - collapsedH > 1;
      setCollapsible(overflows);
      if (!overflows) {
        setExpanded(false);
        setMaxHeight(undefined);
      } else if (!expanded) {
        setMaxHeight(`${collapsedH}px`);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [content.body, expanded, collapsedHeight]);

  const toggle = () => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (!expanded) {
      // Open: collapsed height → full content height, then release to auto.
      setExpanded(true);
      setMaxHeight(`${wrap.scrollHeight}px`);
    } else {
      // Close: pin the current full height, then transition down next frame.
      setMaxHeight(`${wrap.scrollHeight}px`);
      requestAnimationFrame(() => {
        setExpanded(false);
        setMaxHeight(`${collapsedHeight()}px`);
      });
    }
  };

  const handleTransitionEnd = () => {
    // Once open, drop the cap so the text can reflow naturally (resize, etc.).
    if (expanded) setMaxHeight(undefined);
  };

  const isCollapsed = collapsible && !expanded;

  return (
    <section className="zh-bs-writing">
      <div className="zh-bs-wpanel">
        <h2 className="zh-bs-weyebrow">{content.heading}</h2>
        <div
          ref={wrapRef}
          className={`zh-bs-wbodywrap${collapsible ? ' is-collapsible' : ''}${isCollapsed ? ' is-collapsed' : ''}`}
          style={maxHeight !== undefined ? { maxHeight } : undefined}
          onTransitionEnd={handleTransitionEnd}
        >
          <p ref={bodyRef} className="zh-bs-wbody">
            {content.body}
          </p>
        </div>
        {collapsible && (
          <button
            type="button"
            className="zh-bs-wmore"
            aria-expanded={expanded}
            onClick={toggle}
          >
            <span>{expanded ? 'بستن' : 'بیشتر بخوانید'}</span>
            <svg className="zh-bs-wmore-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 9 L12 15 L18 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <button className="zh-bs-upcue" type="button" aria-label="پرفروش‌ترین محصولات" onClick={onOpenFeatured}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 15 L12 9 L18 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>پرفروش‌ترین محصولات</span>
      </button>
    </section>
  );
}
