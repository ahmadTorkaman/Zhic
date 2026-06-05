'use client';

import * as React from 'react';
import { OCCUPANCY_LABELS, OCCUPANCY_ORDER, type Occupancy } from './placeholder-data';

// Renders one pill per occupancy the focused design supports (in canonical
// order), so the tabs change as you swipe between designs. Clicking toggles the
// active pill — the real room-type filter is wired in SP1.
export function CategoryTabs({ occupancies }: { occupancies: Occupancy[] }) {
  const tabs = OCCUPANCY_ORDER.filter((o) => occupancies.includes(o));
  const [active, setActive] = React.useState<Occupancy | null>(() => tabs[0] ?? null);

  // When the focused design changes, keep the selected room-type if it's still
  // offered, otherwise fall back to the first available pill.
  React.useEffect(() => {
    const next = OCCUPANCY_ORDER.filter((o) => occupancies.includes(o));
    setActive((cur) => (cur && next.includes(cur) ? cur : next[0] ?? null));
  }, [occupancies]);

  return (
    <nav className="zh-bs-cats" aria-label="دسته‌بندی اتاق">
      {tabs.map((o) => (
        <button
          key={o}
          type="button"
          data-cat={o}
          className={`zh-bs-cat${active === o ? ' on' : ''}`}
          onClick={() => setActive(o)}
        >
          {OCCUPANCY_LABELS[o]}
        </button>
      ))}
    </nav>
  );
}
