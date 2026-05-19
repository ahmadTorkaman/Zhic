'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Container, MoneyDisplay } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { NavMeta } from '@/lib/payload';
import './pieces-mega-menu.css';

const PIECE_TYPES: Array<{ value: string; label: string }> = [
  { value: 'bed',             label: 'تخت' },
  { value: 'nightstand',      label: 'پاتختی' },
  { value: 'dresser',         label: 'دراور' },
  { value: 'closet',          label: 'کمد' },
  { value: 'mirror',          label: 'آینه' },
  { value: 'vanity',          label: 'میز آرایش' },
  { value: 'display_cabinet', label: 'ویترین' },
  { value: 'console',         label: 'کنسول' },
  { value: 'desk',            label: 'میز تحریر' },
  { value: 'bookcase',        label: 'کتابخانه' },
  { value: 'chair',           label: 'صندلی' },
  { value: 'sofa',            label: 'لاوست' },
];

export type PiecesMegaMenuProps = {
  data: NavMeta;
  /** Pathname for active-link styling on the trigger. */
  pathname: string | null;
};

export function PiecesMegaMenu({ data, pathname }: PiecesMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const active = pathname?.startsWith('/products') ?? false;

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

  const visibleTypes = PIECE_TYPES.filter(
    (p) => (data.pieceCounts?.[p.value as keyof typeof data.pieceCounts] ?? 0) > 0,
  );

  return (
    <div ref={wrapRef} className="zh-pieces-wrap" onMouseLeave={() => setOpen(false)}>
      <button
        ref={triggerRef}
        type="button"
        className="zh-pieces-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-current={active ? 'page' : undefined}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
      >
        تخت و وسایل اتاق خواب
        <span className="zh-pieces-chev" aria-hidden />
      </button>

      <div
        id={menuId}
        className="zh-pieces-panel"
        role="dialog"
        aria-label="منوی قطعات"
        data-open={open ? 'true' : undefined}
      >
        <Container>
          <div className="zh-pieces-body">
            <div className="zh-pieces-main">
              {visibleTypes.length === 0 ? (
                <p className="zh-pieces-empty">هیچ قطعه‌ای پیدا نشد.</p>
              ) : (
                <ul className="zh-pieces-grid">
                  {visibleTypes.map((p) => {
                    const count =
                      data.pieceCounts?.[p.value as keyof typeof data.pieceCounts] ?? 0;
                    return (
                      <li key={p.value}>
                        <Link
                          href={`/products?type=${p.value}`}
                          onClick={() => setOpen(false)}
                        >
                          <span>{p.label}</span>
                          <span className="zh-pieces-count">{toPersianDigits(count)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link href="/products" className="zh-pieces-cta" onClick={() => setOpen(false)}>
                همه‌ی قطعات <span className="zh-pieces-arrow" aria-hidden />
              </Link>
            </div>

            {data.featuredProduct ? (
              <aside className="zh-pieces-featured" aria-label="قطعه‌ی شاخص ماه">
                <p className="zh-pieces-featured__eyebrow">قطعه‌ی شاخص ماه</p>
                {data.featuredProduct.coverImageUrl && (
                  <div
                    className="zh-pieces-featured__media"
                    style={{ backgroundImage: `url(${data.featuredProduct.coverImageUrl})` }}
                    aria-hidden
                  />
                )}
                <h3 className="zh-pieces-featured__title">{data.featuredProduct.name}</h3>
                {data.featuredProduct.tagline && (
                  <p className="zh-pieces-featured__tagline">{data.featuredProduct.tagline}</p>
                )}
                <div className="zh-pieces-featured__price">
                  <MoneyDisplay rials={data.featuredProduct.basePriceRials} />
                </div>
                <Link
                  href={`/products/${data.featuredProduct.slug}`}
                  className="zh-pieces-cta"
                  onClick={() => setOpen(false)}
                >
                  مشاهده‌ی محصول <span className="zh-pieces-arrow" aria-hidden />
                </Link>
              </aside>
            ) : (
              <div aria-hidden /> /* empty cell keeps the grid 2-col */
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}
