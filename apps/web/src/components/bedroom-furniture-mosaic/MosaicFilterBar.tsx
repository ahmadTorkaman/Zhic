'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toPersianDigits } from '@zhic/locale';
import { buildFilterHref } from '@/lib/category-filter-url';
import styles from './MosaicFilterBar.module.css';

export type FilterOption = { value: string; label: string; count?: number };
export type FilterGroup = { key: 'design' | 'material'; label: string; options: FilterOption[] };
export type ConfigOption = { value: string; label: string; href: string };
/** A "which sub-type page" selector (hybrid/facet): selecting + apply navigates. */
export type ConfigGroup = {
  label: string;
  /** «همه» target (the parent category page). */
  parentHref: string;
  /** Active config slug (on a facet page), or null on the parent/all view. */
  active: string | null;
  options: ConfigOption[];
};

export type MosaicFilterBarProps = {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  sortOptions: FilterOption[];
  activeSort: string;
  groups: FilterGroup[];
  active: { design?: string; material?: string };
  config?: ConfigGroup;
};

type Pending = { sort: string; design: string | null; material: string | null; config: string | null };

/**
 * Leaf-page filter control (Direction 2): a «مرتب‌سازی»/«فیلترها» bar that opens
 * a frosted bottom sheet with grouped chips (مرتب‌سازی / طرح / روکش). Selections
 * are pending until «اعمال»; «پاک کردن» clears. URLs built via buildFilterHref,
 * so the server re-renders the filtered + paginated grid. Size is deferred
 * (post-fetch only — see route).
 */
export function MosaicFilterBar({
  basePath,
  searchParams,
  sortOptions,
  activeSort,
  groups,
  active,
  config,
}: MosaicFilterBarProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Pending>({
    sort: activeSort,
    design: active.design ?? null,
    material: active.material ?? null,
    config: config?.active ?? null,
  });

  // Sync the sheet to the live filters as it opens (avoids an effect-setState).
  const openSheet = () => {
    setPending({
      sort: activeSort,
      design: active.design ?? null,
      material: active.material ?? null,
      config: config?.active ?? null,
    });
    setOpen(true);
  };

  // Lock body scroll + close on Escape while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const activeCount = (active.design ? 1 : 0) + (active.material ? 1 : 0);
  const activeSortLabel = sortOptions.find((s) => s.value === activeSort)?.label ?? 'جدیدترین';

  const apply = () => {
    // The config group selects which sub-type PAGE; design/material/sort ride
    // along as params on whatever page we land on.
    let target = basePath;
    if (config) {
      target = pending.config
        ? (config.options.find((o) => o.value === pending.config)?.href ?? config.parentHref)
        : config.parentHref;
    }
    router.push(
      buildFilterHref(target, searchParams, {
        sort: pending.sort === 'newest' ? null : pending.sort,
        design: pending.design,
        material: pending.material,
      }),
      { scroll: true },
    );
    setOpen(false);
  };
  const clear = () => {
    router.push(buildFilterHref(basePath, searchParams, { sort: null, design: null, material: null }), {
      scroll: true,
    });
    setOpen(false);
  };
  const setGroup = (key: 'design' | 'material', value: string) =>
    setPending((p) => ({ ...p, [key]: p[key] === value ? null : value }));

  return (
    <>
      <div className={styles.bar}>
        <button type="button" className={styles.trigger} onClick={openSheet} aria-haspopup="dialog">
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 4v10M7 20v-2M17 4v2M17 10v10" />
            <circle cx="7" cy="17" r="2.4" />
            <circle cx="17" cy="7" r="2.4" />
          </svg>
          <span className={styles.tlabel}>مرتب‌سازی</span>
          <span className={styles.tsub}>{activeSortLabel}</span>
        </button>
        <span className={styles.divider} aria-hidden="true" />
        <button type="button" className={styles.trigger} onClick={openSheet} aria-haspopup="dialog">
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 5h18M6 12h12M10 19h4" />
          </svg>
          <span className={styles.tlabel}>فیلترها</span>
          {activeCount > 0 && <span className={styles.count}>{toPersianDigits(activeCount)}</span>}
        </button>
      </div>

      {open && (
        <div className={styles.scrim} onClick={() => setOpen(false)}>
          <div
            className={styles.sheet}
            role="dialog"
            aria-label="فیلتر و مرتب‌سازی"
            onClick={(e) => e.stopPropagation()}
          >
            <span className={styles.grab} aria-hidden="true" />
            <div className={styles.shead}>
              <span className={styles.stitle}>فیلتر و مرتب‌سازی</span>
              <button type="button" className={styles.clear} onClick={clear}>
                پاک کردن
              </button>
            </div>

            <div className={styles.body}>
              <section className={styles.group}>
                <p className={styles.glabel}>مرتب‌سازی</p>
                <div className={styles.chips}>
                  {sortOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`${styles.chip} ${pending.sort === o.value ? styles.on : ''}`}
                      onClick={() => setPending((p) => ({ ...p, sort: o.value }))}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </section>

              {config && config.options.length > 0 && (
                <section className={styles.group}>
                  <p className={styles.glabel}>{config.label}</p>
                  <div className={styles.chips}>
                    <button
                      type="button"
                      className={`${styles.chip} ${pending.config === null ? styles.on : ''}`}
                      onClick={() => setPending((p) => ({ ...p, config: null }))}
                    >
                      همه
                    </button>
                    {config.options.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`${styles.chip} ${pending.config === o.value ? styles.gold : ''}`}
                        onClick={() => setPending((p) => ({ ...p, config: o.value }))}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {groups.map((g) =>
                g.options.length === 0 ? null : (
                  <section key={g.key} className={styles.group}>
                    <p className={styles.glabel}>{g.label}</p>
                    <div className={styles.chips}>
                      {g.options.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          className={`${styles.chip} ${pending[g.key] === o.value ? styles.gold : ''}`}
                          onClick={() => setGroup(g.key, o.value)}
                        >
                          {o.label}
                          {typeof o.count === 'number' && (
                            <span className={styles.cnum}>{toPersianDigits(o.count)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                ),
              )}
            </div>

            <button type="button" className={styles.apply} onClick={apply}>
              اعمال فیلتر
            </button>
          </div>
        </div>
      )}
    </>
  );
}
