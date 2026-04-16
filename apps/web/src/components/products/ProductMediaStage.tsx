'use client';

import { useState } from 'react';
import { Aspect, ImageGallery } from '@zhic/ui';
import type { GalleryItem } from '@zhic/ui';

type Props = {
  stills: GalleryItem[];
  motion: GalleryItem[];
};

type Tab = 'stills' | 'motion';

export function ProductMediaStage({ stills, motion }: Props) {
  const hasStills = stills.length > 0;
  const hasMotion = motion.length > 0;
  const both = hasStills && hasMotion;
  const initial: Tab = hasStills ? 'stills' : 'motion';
  const [tab, setTab] = useState<Tab>(initial);

  if (!hasStills && !hasMotion) {
    return (
      <Aspect ratio="4/5" className="bg-cream">
        <div className="flex h-full w-full items-center justify-center text-body text-stone">
          تصاویر این محصول به‌زودی منتشر می‌شود
        </div>
      </Aspect>
    );
  }

  const items = tab === 'stills' ? stills : motion;

  return (
    <div className="flex flex-col gap-4">
      {both ? (
        <div role="tablist" aria-label="نمایش محصول" className="flex gap-2">
          <TabButton
            active={tab === 'stills'}
            onClick={() => setTab('stills')}
            controls="media-stills"
          >
            تصاویر
          </TabButton>
          <TabButton
            active={tab === 'motion'}
            onClick={() => setTab('motion')}
            controls="media-motion"
          >
            حرکت
          </TabButton>
        </div>
      ) : null}
      <div
        role="tabpanel"
        id={tab === 'stills' ? 'media-stills' : 'media-motion'}
      >
        <ImageGallery
          items={items}
          layout="grid"
          columns={2}
          cellRatio="4/5"
          lightbox
        />
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  controls,
  children,
}: {
  active: boolean;
  onClick: () => void;
  controls: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className={[
        'rounded-md px-4 py-2 text-small transition-colors',
        'focus-visible:outline-none',
        active
          ? 'bg-charcoal text-ivory'
          : 'bg-transparent text-charcoal hover:bg-sand/60',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
