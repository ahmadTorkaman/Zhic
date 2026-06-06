'use client';

import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { NAV_LINKS, isNavActive } from './navLinks';
import { SOCIAL_LABELS, type SocialLink } from './FooterContactStrip';
import './mobile-menu.css';

export type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
  socials?: SocialLink[];
};

type Item = { label: string; href: string };

// Sets + Pieces are hardcoded here because SetsMegaMenu / PiecesMegaMenu
// own them on desktop and they don't live in NAV_LINKS. Order matches the
// previous MainView layout so the mobile and desktop nav read the same.
const ITEMS: Item[] = [
  { label: 'سرویس خواب', href: '/bedroom-set' },
  { label: 'مبلمان اتاق خواب', href: '/bedroom-furniture' },
  ...NAV_LINKS,
];

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function MobileMenu({ open, onClose, pathname, socials = [] }: MobileMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prelayersRef = useRef<HTMLDivElement>(null);
  const openTlRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const closeTweenRef = useRef<ReturnType<typeof gsap.to> | null>(null);
  const hasOpenedRef = useRef(false);

  // Park panel + sweep layers past the RIGHT edge (RTL entrance side).
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const layers = prelayersRef.current ? Array.from(prelayersRef.current.children) : [];
    if (!panel) return;
    gsap.set([...layers, panel], { xPercent: 100 });
  }, []);

  const resetHiddenStates = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const labels = panel.querySelectorAll('.zh-mm__label');
    const numbered = panel.querySelectorAll('.zh-mm__list[data-numbering] .zh-mm__link');
    const socialTitle = panel.querySelector('.zh-mm__socials-title');
    const socialLinks = panel.querySelectorAll('.zh-mm__social-link');
    if (labels.length) gsap.set(labels, { yPercent: 140, rotate: 10 });
    if (numbered.length) gsap.set(numbered, { '--zh-mm-num-opacity': 0 });
    if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
    if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });
  }, []);

  const playOpen = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const layers = prelayersRef.current ? Array.from(prelayersRef.current.children) : [];

    closeTweenRef.current?.kill();
    closeTweenRef.current = null;
    openTlRef.current?.kill();

    const labels = panel.querySelectorAll('.zh-mm__label');
    const numbered = panel.querySelectorAll('.zh-mm__list[data-numbering] .zh-mm__link');
    const socialTitle = panel.querySelector('.zh-mm__socials-title');
    const socialLinks = panel.querySelectorAll('.zh-mm__social-link');

    if (prefersReduced()) {
      gsap.set([...layers, panel], { xPercent: 0 });
      if (labels.length) gsap.set(labels, { yPercent: 0, rotate: 0 });
      if (numbered.length) gsap.set(numbered, { '--zh-mm-num-opacity': 1 });
      if (socialTitle) gsap.set(socialTitle, { opacity: 1 });
      if (socialLinks.length) gsap.set(socialLinks, { y: 0, opacity: 1 });
      return;
    }

    resetHiddenStates();

    // Timings ported 1:1 from React Bits StaggeredMenu.
    const tl = gsap.timeline();
    layers.forEach((el, i) => {
      tl.fromTo(el, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'power4.out' }, i * 0.07);
    });
    const lastTime = layers.length ? (layers.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layers.length ? 0.08 : 0);
    const panelDuration = 0.65;
    tl.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime,
    );
    const itemsStart = panelInsertTime + panelDuration * 0.15;
    if (labels.length) {
      tl.to(labels, { yPercent: 0, rotate: 0, duration: 1, ease: 'power4.out', stagger: { each: 0.1, from: 'start' } }, itemsStart);
    }
    if (numbered.length) {
      tl.to(numbered, { duration: 0.6, ease: 'power2.out', '--zh-mm-num-opacity': 1, stagger: { each: 0.08, from: 'start' } }, itemsStart + 0.1);
    }
    const socialsStart = panelInsertTime + panelDuration * 0.4;
    if (socialTitle) {
      tl.to(socialTitle, { opacity: 1, duration: 0.5, ease: 'power2.out' }, socialsStart);
    }
    if (socialLinks.length) {
      tl.to(socialLinks, { y: 0, opacity: 1, duration: 0.55, ease: 'power3.out', stagger: { each: 0.08, from: 'start' } }, socialsStart + 0.04);
    }
    openTlRef.current = tl;
  }, [resetHiddenStates]);

  const playClose = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const layers = prelayersRef.current ? Array.from(prelayersRef.current.children) : [];

    openTlRef.current?.kill();
    openTlRef.current = null;
    closeTweenRef.current?.kill();

    if (prefersReduced()) {
      gsap.set([...layers, panel], { xPercent: 100 });
      resetHiddenStates();
      return;
    }

    closeTweenRef.current = gsap.to([...layers, panel], {
      xPercent: 100,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: resetHiddenStates,
    });
  }, [resetHiddenStates]);

  // open prop drives the timelines. The latch skips the close sweep until
  // the menu has actually opened once (covers both first mount and
  // StrictMode's double-invoked effects).
  useEffect(() => {
    if (open) {
      hasOpenedRef.current = true;
      playOpen();
    } else if (hasOpenedRef.current) {
      playClose();
    }
  }, [open, playOpen, playClose]);

  // Body scroll lock — keyed on `open`.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Esc dismisses. Flat — no sub-views to step back through.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Move focus into the dialog when it opens so keyboard / AT users
  // don't stay focused on the hamburger button behind the overlay.
  useEffect(() => {
    if (open) rootRef.current?.focus();
  }, [open]);

  const validSocials = socials.filter((s) => s.platform in SOCIAL_LABELS);

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="منو"
      aria-hidden={!open}
      inert={!open || undefined}
      data-open={open || undefined}
      className="zh-mm focus:outline-none"
    >
      <div ref={prelayersRef} className="zh-mm__prelayers" aria-hidden>
        <div className="zh-mm__prelayer zh-mm__prelayer--1" />
        <div className="zh-mm__prelayer zh-mm__prelayer--2" />
      </div>

      <div ref={panelRef} className="zh-mm__panel">
        <button type="button" aria-label="بستن" onClick={onClose} className="zh-mm__close">
          <svg viewBox="0 0 14 14" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
            <path d="M1 1L13 13M13 1L1 13" strokeLinecap="round" />
          </svg>
        </button>

        <div className="zh-mm__brand">
          <img src="/zhic-logo.svg" alt="ژیک" />
        </div>

        <ul aria-label="پیمایش اصلی" className="zh-mm__list" data-numbering>
          {ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href);
            return (
              <li key={item.href} className="zh-mm__itemWrap">
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? 'page' : undefined}
                  className={`zh-mm__link${active ? ' is-active' : ''}`}
                >
                  <span className="zh-mm__label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {validSocials.length > 0 && (
          <div className="zh-mm__socials" aria-label="شبکه‌های اجتماعی">
            <h3 className="zh-mm__socials-title">شبکه‌های اجتماعی</h3>
            <ul className="zh-mm__socials-list">
              {validSocials.map((s) => (
                <li key={s.platform}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="zh-mm__social-link">
                    {SOCIAL_LABELS[s.platform]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
