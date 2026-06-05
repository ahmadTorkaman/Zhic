'use client';

import { OCCUPANCY_LABELS, OCCUPANCY_ORDER, type Occupancy } from './placeholder-data';

// Controlled: renders one pill per occupancy the focused design supports (in
// canonical order). The selected room-type is owned by DesignCarousel so it can
// swap the carousel card to that room-type's photo.
export function CategoryTabs({
  occupancies,
  active,
  onSelect,
}: {
  occupancies: Occupancy[];
  active: Occupancy | null;
  onSelect: (o: Occupancy) => void;
}) {
  const tabs = OCCUPANCY_ORDER.filter((o) => occupancies.includes(o));
  return (
    <nav className="zh-bs-cats" aria-label="دسته‌بندی اتاق">
      {tabs.map((o) => (
        <button
          key={o}
          type="button"
          data-cat={o}
          className={`zh-bs-cat${active === o ? ' on' : ''}`}
          onClick={() => onSelect(o)}
        >
          {OCCUPANCY_LABELS[o]}
        </button>
      ))}
    </nav>
  );
}
