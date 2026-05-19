'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Container } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { NavMeta } from '@/lib/payload';
import './sets-mega-menu.css';

export type SetsMegaMenuProps = {
  data: NavMeta;
  /** Pathname for active-link styling on the trigger. */
  pathname: string | null;
};

export function SetsMegaMenu({ data, pathname }: SetsMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const active = pathname?.startsWith('/designs') ?? false;

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

  return (
    <div ref={wrapRef} className="zh-sets-wrap" onMouseLeave={() => setOpen(false)}>
      <button
        ref={triggerRef}
        type="button"
        className="zh-sets-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-current={active ? 'page' : undefined}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
      >
        سرویس خواب
        <span className="zh-sets-chev" aria-hidden />
      </button>

      <div
        id={menuId}
        className="zh-sets-panel"
        role="dialog"
        aria-label="منوی سرویس خواب"
        data-open={open ? 'true' : undefined}
      >
        <Container>
          <div className="zh-sets-body">
            {data.designs.length === 0 ? (
              <p className="zh-sets-empty">هیچ سرویسی پیدا نشد.</p>
            ) : (
              <div className="zh-sets-main">
                <ul className="zh-sets-grid">
                  {data.designs.map((d) => (
                    <li key={d.id}>
                      <Link
                        href={`/designs/${encodeURIComponent(d.slug)}`}
                        className="zh-sets-tile"
                        onClick={() => setOpen(false)}
                      >
                        {d.coverUrl && (
                          <div
                            className="zh-sets-tile__media"
                            style={{ backgroundImage: `url(${d.coverUrl})` }}
                            aria-hidden
                          />
                        )}
                        <div className="zh-sets-tile__name">{d.name}</div>
                        <div className="zh-sets-tile__count">
                          {toPersianDigits(d.productCount)} قطعه
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/designs" className="zh-sets-cta" onClick={() => setOpen(false)}>
                  همه‌ی سرویس‌ها <span className="zh-sets-arrow" aria-hidden />
                </Link>
              </div>
            )}

            {data.featuredDesign ? (
              <aside className="zh-sets-featured" aria-label="سرویس شاخص ماه">
                <p className="zh-sets-featured__eyebrow">سرویس شاخص ماه</p>
                {data.featuredDesign.coverUrl && (
                  <div
                    className="zh-sets-featured__media"
                    style={{ backgroundImage: `url(${data.featuredDesign.coverUrl})` }}
                    aria-hidden
                  />
                )}
                <h3 className="zh-sets-featured__title">{data.featuredDesign.name}</h3>
                {data.featuredDesign.tagline && (
                  <p className="zh-sets-featured__tagline">{data.featuredDesign.tagline}</p>
                )}
                <Link
                  href={`/designs/${encodeURIComponent(data.featuredDesign.slug)}`}
                  className="zh-sets-cta"
                  onClick={() => setOpen(false)}
                >
                  مشاهده‌ی سرویس <span className="zh-sets-arrow" aria-hidden />
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
