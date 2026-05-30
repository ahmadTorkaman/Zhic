'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Container } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { NavMeta } from '@/lib/payload';
import './pieces-mega-menu.css';

type PieceChild = {
  label: string;
  /** Canonical category slug under /bedroom-furniture/. Used to read the
   *  product count from data.categories. */
  slug: string;
  href: string;
};

type PieceGroup = {
  /** Header label shown above the children. */
  title: string;
  /** Optional href — if omitted, the header is a pure grouping label
   *  (no parent page exists, e.g. کتابخانه و ویترین). */
  href?: string;
  /** Slug used to look up the count for the header (parent category). */
  slug?: string;
  /** If true, render as a single leaf row instead of header + children. */
  leaf?: boolean;
  children?: PieceChild[];
};

/**
 * 3-column tree mirroring the Zhic category Map.png. Each column lists its
 * groups top-to-bottom in Map order. Leaves and grouping nodes are mixed.
 *
 * The href on each link is the canonical /bedroom-furniture path for that
 * category as it currently exists in the DB (verified 2026-05-23). Some
 * Map nodes don't have a direct DB equivalent — see inline comments.
 */
const PIECES_COLUMNS: PieceGroup[][] = [
  // ── Column 1 (visual right under RTL) ──
  [
    {
      title: 'تخت خواب',
      href: '/bedroom-furniture/bed',
      slug: 'bed',
      children: [
        { label: 'نوزادی',   slug: 'baby',         href: '/bedroom-furniture/bed/baby' },
        { label: 'یک‌نفره',  slug: 'single',       href: '/bedroom-furniture/bed/single' },
        { label: 'دونفره',   slug: 'double',       href: '/bedroom-furniture/bed/double' },
        { label: 'دوطبقه',   slug: 'bunk',         href: '/bedroom-furniture/bed/bunk' },
        // convertible lives under bed/baby in the DB; surface it at the bed level for the Map's flat reading.
        { label: 'دومنظوره', slug: 'convertible',  href: '/bedroom-furniture/bed/baby/convertible' },
        // No dedicated "sofa-bed" category yet; loveseat is the closest piece.
        { label: 'کاناپه‌ای', slug: 'loveseat',    href: '/bedroom-furniture/seating/loveseat' },
      ],
    },
    {
      title: 'پاتختی',
      href: '/bedroom-furniture/nightstand',
      slug: 'nightstand',
      leaf: true,
    },
    {
      title: 'تجهیزات جانبی تخت',
      href: '/bedroom-furniture/complement',
      slug: 'complement',
      children: [
        { label: 'حفاظ تخت',   slug: 'bed-guard',     href: '/bedroom-furniture/complement/bed-guard' },
        { label: 'باکس تخت',   slug: 'bed-box',       href: '/bedroom-furniture/complement/bed-box' },
        { label: 'جک کفی تخت', slug: 'bed-jack',      href: '/bedroom-furniture/complement/bed-jack' },
        { label: 'صفحه تعویض', slug: 'changing-top',  href: '/bedroom-furniture/complement/changing-top' },
        { label: 'میز تعویض',  slug: 'changing-table',href: '/bedroom-furniture/complement/changing-table' },
        { label: 'شلف دیواری', slug: 'wall-shelf',    href: '/bedroom-furniture/complement/wall-shelf' },
      ],
    },
  ],
  // ── Column 2 ──
  [
    {
      title: 'کمد',
      href: '/bedroom-furniture/storage/wardrobe',
      slug: 'wardrobe',
      children: [
        { label: 'کمد یک‌درب', slug: 'single-door', href: '/bedroom-furniture/storage/wardrobe/single-door' },
        { label: 'کمد دو‌درب', slug: 'double-door', href: '/bedroom-furniture/storage/wardrobe/double-door' },
        { label: 'کمد سه‌درب', slug: 'triple-door', href: '/bedroom-furniture/storage/wardrobe/triple-door' },
        { label: 'کمد ریلی',   slug: 'sliding',     href: '/bedroom-furniture/storage/wardrobe/sliding' },
      ],
    },
    {
      title: 'میز',
      href: '/bedroom-furniture/table',
      slug: 'table',
      children: [
        { label: 'میز تحریر', slug: 'study-desk', href: '/bedroom-furniture/table/study-desk' },
        { label: 'میز آرایش', slug: 'vanity',     href: '/bedroom-furniture/table/vanity' },
        // console lives under /display in the DB, not /table — link to its canonical path.
        { label: 'میز کنسول', slug: 'console',    href: '/bedroom-furniture/display/console' },
      ],
    },
    {
      // Grouping label — no parent page, just a header that groups two leaves.
      title: 'کتابخانه و ویترین',
      children: [
        { label: 'کتابخانه', slug: 'bookcase',         href: '/bedroom-furniture/storage/bookcase' },
        { label: 'ویترین',   slug: 'display-cabinet',  href: '/bedroom-furniture/display/display-cabinet' },
      ],
    },
  ],
  // ── Column 3 ──
  [
    {
      // Grouping — file lives under /storage; no dedicated "dresser" category yet.
      title: 'دراور و فایل',
      children: [
        { label: 'فایل', slug: 'file-cabinet', href: '/bedroom-furniture/storage/file-cabinet' },
      ],
    },
    {
      title: 'صندلی',
      href: '/bedroom-furniture/seating',
      slug: 'seating',
      children: [
        { label: 'صندلی آرایش', slug: 'vanity-chair', href: '/bedroom-furniture/seating/vanity-chair' },
        { label: 'صندلی تحریر', slug: 'study-chair',  href: '/bedroom-furniture/seating/study-chair' },
      ],
    },
    {
      title: 'آینه',
      href: '/bedroom-furniture/mirror',
      slug: 'mirror',
      children: [
        { label: 'آینه قدی',    slug: 'standing-mirror', href: '/bedroom-furniture/mirror/standing-mirror' },
        { label: 'آینه دیواری', slug: 'wall-mirror',     href: '/bedroom-furniture/mirror/wall-mirror' },
        { label: 'آینه رومیزی', slug: 'table-mirror',    href: '/bedroom-furniture/mirror/table-mirror' },
      ],
    },
  ],
];

export type PiecesMegaMenuProps = {
  data: NavMeta;
  pathname: string | null;
};

export function PiecesMegaMenu({ data, pathname }: PiecesMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLAnchorElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const menuId = useId();
  const active = pathname?.startsWith('/bedroom-furniture') ?? false;

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (open) setHasOpened(true); }, [open]);

  // 140ms grace timer so the mouse can cross the gap between trigger and panel.
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

  // Build a slug → count map from NavMeta.categories for inline counts.
  const countBySlug = new Map<string, number>();
  for (const c of data.categories ?? []) {
    if (c.slug) countBySlug.set(c.slug, c.productCount ?? 0);
  }

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
      className="zh-pieces-panel"
      role="dialog"
      aria-label="منوی مبلمان اتاق خواب"
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
          <div className="zh-pieces-body">

            <div className="zh-pieces-head">
              <div className="zh-pieces-eyebrow">مبلمان اتاق خواب</div>
              <div className="zh-pieces-title">
                قطعات <em>اتاق خواب</em>
              </div>
            </div>

            <div className="zh-pieces-cols">
              {PIECES_COLUMNS.map((column, ci) => (
                <div key={ci} className="zh-pieces-col">
                  {column.map((group, gi) => {
                    if (group.leaf) {
                      return (
                        <div key={gi} className="zh-piece-cat zh-piece-cat--leaf">
                          <Link
                            href={group.href!}
                            className="zh-piece-cat-name"
                            onClick={() => setOpen(false)}
                          >
                            <span>{group.title}</span>
                            <span className="zh-piece-leaf-mark">— مشاهده‌ی همه</span>
                          </Link>
                        </div>
                      );
                    }
                    return (
                      <div key={gi} className="zh-piece-cat">
                        {group.href ? (
                          <Link
                            href={group.href}
                            className="zh-piece-cat-name"
                            onClick={() => setOpen(false)}
                          >
                            {group.title}
                          </Link>
                        ) : (
                          <span className="zh-piece-cat-name zh-piece-cat-name--group">
                            {group.title}
                          </span>
                        )}
                        {group.children && group.children.length > 0 && (
                          <ul className="zh-piece-sub-list">
                            {group.children.map((child) => {
                              const count = countBySlug.get(child.slug) ?? 0;
                              return (
                                <li key={child.slug}>
                                  <Link
                                    href={child.href}
                                    className="zh-piece-sub-link"
                                    onClick={() => setOpen(false)}
                                  >
                                    <span>{child.label}</span>
                                    {count > 0 && (
                                      <span className="zh-piece-sub-count">
                                        {toPersianDigits(count)}
                                      </span>
                                    )}
                                  </Link>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="zh-pieces-foot">
              <Link href="/bedroom-furniture" className="zh-pieces-cta" onClick={() => setOpen(false)}>
                مشاهده‌ی همه‌ی قطعات
                <span className="zh-pieces-arrow-inline" aria-hidden />
              </Link>
              <span className="zh-pieces-foot-note">
                رنگ و نوع چوب در صفحه‌ی هر دسته فیلتر می‌شود
              </span>
            </div>

          </div>
        </Container>
    </div>
  );

  return (
    <div ref={wrapRef} className="zh-pieces-wrap">
      <Link
        ref={triggerRef}
        href="/bedroom-furniture"
        className="zh-pieces-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-current={active ? 'page' : undefined}
        onMouseEnter={() => { cancelClose(); setOpen(true); }}
        onMouseLeave={scheduleClose}
        onClick={() => setOpen(false)}
      >
        مبلمان اتاق خواب
        <span className="zh-pieces-chev" aria-hidden />
      </Link>
      {mounted && hasOpened ? createPortal(panel, document.body) : null}
    </div>
  );
}
