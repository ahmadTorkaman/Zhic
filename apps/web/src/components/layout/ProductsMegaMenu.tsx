'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { Container, MoneyDisplay } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import type { NavMeta } from '@/lib/payload';
import './products-mega-menu.css';

type Tab = 'categories' | 'designs' | 'collections';

export type ProductsMegaMenuProps = {
  data: NavMeta;
  /** Pathname for active-link styling on the trigger. */
  pathname: string | null;
};

export function ProductsMegaMenu({ data, pathname }: ProductsMegaMenuProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('categories');
  const [locked, setLocked] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const active = pathname?.startsWith('/products') ?? false;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setLocked(false);
        triggerRef.current?.focus();
      }
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setLocked(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [open]);

  const handleTabClick = (tab: Tab) => {
    setActiveTab(tab);
    setLocked(true);
  };

  return (
    <div
      ref={wrapRef}
      className="zh-mega-wrap"
      onMouseLeave={() => setLocked(false)}
    >
      <button
        ref={triggerRef}
        type="button"
        className="zh-mega-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={menuId}
        aria-current={active ? 'page' : undefined}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
      >
        محصولات
        <span className="zh-chev" aria-hidden />
      </button>

      <div
        id={menuId}
        className="zh-mega"
        role="dialog"
        aria-label="منوی محصولات"
        data-open={open ? 'true' : undefined}
        data-active-tab={activeTab}
        data-locked={locked ? 'true' : undefined}
      >
        <Container>
          <div className="zh-mega-head">
            <div role="tablist" aria-label="فیلتر منوی محصولات" className="zh-mega-tabs">
              <TabButton tab="categories" label="دسته‌بندی‌ها" activeTab={activeTab} onClick={handleTabClick} />
              <TabButton tab="designs" label="طرح‌ها" activeTab={activeTab} onClick={handleTabClick} />
              <TabButton tab="collections" label="مجموعه‌ها" activeTab={activeTab} onClick={handleTabClick} />
            </div>

            <form className="zh-mega-search" action="/products" method="get" role="search">
              <span className="zh-mega-search__icon" aria-hidden>
                <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="5" />
                  <path d="M11 11l3 3" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="search"
                name="q"
                placeholder="جستجوی محصول، طرح یا مجموعه…"
                aria-label="جستجو در محصولات"
              />
            </form>
          </div>

          <div className="zh-mega-body">
            <div className="zh-mega-panels">
              <CategoriesPanel items={data.categories} />
              <DesignsPanel items={data.designs} />
              <CollectionsPanel items={data.collections} />
            </div>

            {data.featuredProduct ? (
              <FeaturedAside product={data.featuredProduct} />
            ) : (
              <div aria-hidden /> /* empty cell keeps the grid 2-col */
            )}
          </div>
        </Container>
      </div>
    </div>
  );
}

function TabButton({
  tab,
  label,
  activeTab,
  onClick,
}: {
  tab: Tab;
  label: string;
  activeTab: Tab;
  onClick: (tab: Tab) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${tab}`}
      data-tab={tab}
      className="zh-mega-tab"
      aria-selected={activeTab === tab}
      aria-controls={`panel-${tab}`}
      onClick={() => onClick(tab)}
    >
      {label}
    </button>
  );
}

function CategoriesPanel({ items }: { items: NavMeta['categories'] }) {
  return (
    <div className="zh-mega-panel" data-panel="categories" role="tabpanel" id="panel-categories" aria-labelledby="tab-categories">
      {items.length === 0 ? (
        <p className="zh-mega-empty">هیچ دسته‌بندی پیدا نشد.</p>
      ) : (
        <>
          <ul className="zh-mega-grid">
            {items.map((c) => (
              <li key={c.id}>
                <Link href={`/products?cat=${encodeURIComponent(c.slug)}`}>
                  <span>{c.name}</span>
                  <span className="zh-count">{toPersianDigits(c.productCount)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/products" className="zh-mega-cta">
            همه‌ی محصولات <Arrow />
          </Link>
        </>
      )}
    </div>
  );
}

function DesignsPanel({ items }: { items: NavMeta['designs'] }) {
  return (
    <div className="zh-mega-panel" data-panel="designs" role="tabpanel" id="panel-designs" aria-labelledby="tab-designs">
      {items.length === 0 ? (
        <p className="zh-mega-empty">هیچ طرحی پیدا نشد.</p>
      ) : (
        <ul className="zh-mega-grid zh-mega-grid--rich">
          {items.map((d) => (
            <li key={d.id}>
              <Link href={`/products?design=${encodeURIComponent(d.slug)}`}>
                <span className="zh-mega-grid__title">{d.name}</span>
                {d.subtitle ? <span className="zh-mega-grid__sub">{d.subtitle}</span> : null}
                <span className="zh-count">{toPersianDigits(d.productCount)} محصول</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CollectionsPanel({ items }: { items: NavMeta['collections'] }) {
  return (
    <div className="zh-mega-panel" data-panel="collections" role="tabpanel" id="panel-collections" aria-labelledby="tab-collections">
      {items.length === 0 ? (
        <p className="zh-mega-empty">هیچ مجموعه‌ای پیدا نشد.</p>
      ) : (
        <ul className="zh-mega-grid zh-mega-grid--rich">
          {items.map((c) => (
            <li key={c.id}>
              <Link href={`/collections/${encodeURIComponent(c.slug)}`}>
                <span className="zh-mega-grid__title">{c.name}</span>
                {c.subtitle ? <span className="zh-mega-grid__sub">{c.subtitle}</span> : null}
                <span className="zh-count">{toPersianDigits(c.productCount)} محصول</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FeaturedAside({ product }: { product: NonNullable<NavMeta['featuredProduct']> }) {
  return (
    <aside className="zh-mega-featured" aria-label="محصول شاخص ماه">
      <p className="zh-mega-eyebrow">محصول شاخص ماه</p>
      <div className="zh-mega-feature">
        <div className="zh-mega-feature__media">
          {product.coverImageUrl ? (
            <img src={product.coverImageUrl} alt="" loading="lazy" />
          ) : (
            <span style={{ position: 'absolute', insetInlineEnd: '8%', insetBlockStart: '6%', fontSize: '5rem', lineHeight: 1, color: 'var(--color-ivory)', opacity: 0.65, fontWeight: 900 }} aria-hidden>ژ</span>
          )}
        </div>
        <h3 className="zh-mega-feature__title">{product.name}</h3>
        {product.tagline ? <p className="zh-mega-feature__tagline">{product.tagline}</p> : null}
        <div className="zh-mega-feature__price">
          <MoneyDisplay rials={product.basePriceRials} />
        </div>
        <Link href={`/products/${encodeURIComponent(product.slug)}`} className="zh-mega-cta">
          مشاهده محصول <Arrow />
        </Link>
      </div>
    </aside>
  );
}

function Arrow() {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: '1rem',
        height: '1px',
        background: 'currentColor',
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          insetInlineStart: '-2px',
          top: '-3px',
          width: '7px',
          height: '7px',
          borderInlineStart: '1.5px solid currentColor',
          borderBlockEnd: '1.5px solid currentColor',
          transform: 'rotate(45deg)',
          display: 'block',
        }}
      />
    </span>
  );
}

