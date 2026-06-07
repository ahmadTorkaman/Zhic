'use client';

import { OCCUPANCY_LABELS, OCCUPANCY_ORDER, type Occupancy } from './placeholder-data';

// Renders one pill per occupancy the focused design supports (in canonical
// order). Hovering a pill sets the active room-type so the focused card can
// preview it (desktop); clicking opens the design page filtered to that age.
export function CategoryTabs({
  occupancies,
  active,
  onPreview,
  onOpen,
}: {
  occupancies: Occupancy[];
  active: Occupancy | null;
  /** Desktop hover/focus — preview this room-type on the focused card. */
  onPreview: (o: Occupancy | null) => void;
  /** Click/tap — navigate to the design page filtered to this age. */
  onOpen: (o: Occupancy) => void;
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
          onClick={() => onOpen(o)}
          onPointerEnter={(e) => { if (e.pointerType === 'mouse') onPreview(o); }}
          onPointerLeave={(e) => { if (e.pointerType === 'mouse') onPreview(null); }}
          onFocus={() => onPreview(o)}
          onBlur={() => onPreview(null)}
        >
          {OCCUPANCY_LABELS[o]}
        </button>
      ))}
    </nav>
  );
}
