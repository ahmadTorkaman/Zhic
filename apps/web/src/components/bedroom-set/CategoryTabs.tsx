'use client';

import * as React from 'react';

// Stub: toggles the active pill only. Real occupancy filtering/linking is SP1.
const CATS = [
  { key: 'newborn', label: 'نـــــوزاد' },
  { key: 'teen', label: 'نـــــوجوان' },
  { key: 'couple', label: 'دونـــــفره' },
] as const;

export function CategoryTabs() {
  const [active, setActive] = React.useState<string>('newborn');
  return (
    <nav className="zh-bs-cats" aria-label="دسته‌بندی اتاق">
      {CATS.map((c) => (
        <button
          key={c.key}
          type="button"
          data-cat={c.key}
          className={`zh-bs-cat${active === c.key ? ' on' : ''}`}
          onClick={() => setActive(c.key)}
        >
          {c.label}
        </button>
      ))}
    </nav>
  );
}
