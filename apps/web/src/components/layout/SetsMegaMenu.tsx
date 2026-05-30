'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Container } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { NavMeta } from '@/lib/payload';
import './sets-mega-menu.css';

type Occupancy = 'baby' | 'teen' | 'double' | 'bunk';

type OccupancyDef = {
  slug: Occupancy;
  num: string;
  label: string;
  title: React.ReactNode;
  tagline: string;
  heroSrc: string;
};

const OCCUPANCIES: OccupancyDef[] = [
  {
    slug: 'baby',
    num: '۰۱',
    label: 'نوزاد',
    title: <>آرامش <em>اولین</em> شب‌ها</>,
    tagline: 'از تخت کناری تا تختخواب تخت‌ریز، طراحی‌شده برای ماه‌های نخستین.',
    heroSrc: '/sets-hero/baby.webp',
  },
  {
    slug: 'teen',
    num: '۰۲',
    label: 'نوجوان',
    title: <>فضای <em>شخصی</em> در حال تغییر</>,
    tagline: 'ساده، با امکان رشد. کمد بزرگ، میز تحریر، خوابی برای فکر‌کردن.',
    heroSrc: '/sets-hero/teen.webp',
  },
  {
    slug: 'double',
    num: '۰۳',
    label: 'دونفره',
    title: <>اتاق خوابی <em>برای ماندن</em></>,
    tagline: 'ترکیبی کامل از تخت، پاتختی، کمد و آینه — هر کدام به‌اندازه‌ی قدمی به سکوت.',
    heroSrc: '/sets-hero/double.webp',
  },
  {
    slug: 'bunk',
    num: '۰۴',
    label: 'دوطبقه',
    title: <>دو خواب، <em>یک خاطره</em></>,
    tagline: 'برای دو خواهر، دو برادر، یا دو شب از یک تعطیلات. صرفه‌جویی بدون افت.',
    heroSrc: '/sets-hero/bunk.webp',
  },
];

const DEFAULT_OCC: Occupancy = 'double';

export type SetsMegaMenuProps = {
  data: NavMeta;
  pathname: string | null;
};

export function SetsMegaMenu({ data, pathname }: SetsMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [activeOcc, setActiveOcc] = useState<Occupancy>(DEFAULT_OCC);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const menuId = useId();
  const active = pathname?.startsWith('/bedroom-set') ?? false;

  // Portal target = document.body. Mounted-flag avoids SSR/client mismatch.
  useEffect(() => { setMounted(true); }, []);

  // First-open latch — once the user opens the dropdown once, keep the
  // panel mounted so subsequent opens are instant. Before first open, the
  // panel is not in the DOM at all (saves 4 image loads + glass card paint
  // on every page that never uses the dropdown).
  useEffect(() => { if (open) setHasOpened(true); }, [open]);

  // Bridge the gap between the trigger and the portaled panel: when mouse
  // leaves the trigger, schedule a close in 140ms. If the mouse enters the
  // panel before then, the timer is cancelled and the dropdown stays open.
  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 140);
  };
  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  const panel = (
    <div
      id={menuId}
      className="zh-sets-panel"
      role="dialog"
      aria-label="منوی سرویس خواب"
      data-open={open ? 'true' : undefined}
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
      style={{
        backgroundColor: 'var(--glass-bg-chrome)',
        backdropFilter: 'blur(var(--glass-blur-chrome)) saturate(var(--glass-saturate-chrome))',
        WebkitBackdropFilter: 'blur(var(--glass-blur-chrome)) saturate(var(--glass-saturate-chrome))',
      }}
    >
        <Container>
          <div className="zh-sets-grid">

            {/* Labels column (visual right under RTL) */}
            <div className="zh-sets-labels">
              <div className="zh-sets-eyebrow">سرویس خواب</div>
              <ul className="zh-sets-list">
                {OCCUPANCIES.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/bedroom-set/${o.slug}`}
                      className="zh-sets-row"
                      data-active={activeOcc === o.slug ? 'true' : undefined}
                      onMouseEnter={() => setActiveOcc(o.slug)}
                      onFocus={() => setActiveOcc(o.slug)}
                      onClick={() => setOpen(false)}
                    >
                      <span className="zh-sets-num">{o.num}</span>
                      <span className="zh-sets-name">{o.label}</span>
                      <span className="zh-sets-arrow" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="zh-sets-cta-wrap">
                <Link href="/bedroom-set" className="zh-sets-cta" onClick={() => setOpen(false)}>
                  مشاهده‌ی همه‌ی سرویس‌ها
                  <span className="zh-sets-arrow-inline" aria-hidden />
                </Link>
              </div>
            </div>

            {/* Hero column (visual left under RTL) */}
            <div className="zh-sets-hero">
              {/* All 4 photos rendered; opacity-fade between them */}
              {OCCUPANCIES.map((o) => (
                <img
                  key={o.slug}
                  className="zh-sets-img"
                  data-active={activeOcc === o.slug ? 'true' : undefined}
                  src={o.heroSrc}
                  alt=""
                  aria-hidden
                />
              ))}

              {/* Glass card stack — only the active occupancy's content renders */}
              {OCCUPANCIES.map((o) => {
                if (o.slug !== activeOcc) return null;
                const stats = data.occupancyCounts?.[o.slug];
                return (
                  <div key={o.slug} className="zh-sets-cards">
                    <div className="zh-sets-card-main">
                      <div className="zh-sets-card-eyebrow">سرویس خواب {o.label}</div>
                      <h3 className="zh-sets-card-title">{o.title}</h3>
                      <p className="zh-sets-card-tagline">{o.tagline}</p>
                    </div>
                    <Link
                      href={`/bedroom-set/${o.slug}`}
                      className="zh-sets-card-sub"
                      onClick={() => setOpen(false)}
                    >
                      <span className="zh-sets-sub-stat">
                        {stats && stats.designs > 0 ? (
                          <>
                            <strong>{toPersianDigits(stats.designs)}</strong> سرویس
                            {stats.pieces > 0 && <> · {toPersianDigits(stats.pieces)} قطعه</>}
                          </>
                        ) : (
                          <>به‌زودی</>
                        )}
                      </span>
                      <span className="zh-sets-sub-cta">مشاهده‌ی سرویس‌ها</span>
                    </Link>
                  </div>
                );
              })}
            </div>

          </div>
        </Container>
    </div>
  );

  return (
    <div ref={wrapRef} className="zh-sets-wrap">
      <Link
        ref={triggerRef}
        href="/bedroom-set"
        className="zh-sets-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-current={active ? 'page' : undefined}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
        onClick={() => setOpen(false)}
      >
        سرویس خواب
        <span className="zh-sets-chev" aria-hidden />
      </Link>
      {/* Lazy-render the portal: it only enters the DOM after the menu has
          been opened at least once. Avoids paying the DOM cost (4 hero
          images, glass cards) on every page where the dropdown is never
          opened. Once mounted, the panel stays mounted and toggles via
          opacity for smooth subsequent opens. */}
      {mounted && hasOpened ? createPortal(panel, document.body) : null}
    </div>
  );
}
