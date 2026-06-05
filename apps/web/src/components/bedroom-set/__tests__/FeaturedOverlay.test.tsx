/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { FeaturedOverlay } from '../FeaturedOverlay';
import { FEATURED_PAGES } from '../placeholder-data';

beforeAll(() => {
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true, configurable: true,
    value: (cb: FrameRequestCallback) => { cb(0); return 0; },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true, configurable: true, value: () => {},
  });
});

describe('<FeaturedOverlay>', () => {
  it('SSRs page-0 content (hero + 2 tiles + 2 page dots) even while closed', () => {
    const { container } = render(
      <FeaturedOverlay pages={FEATURED_PAGES} view="designs" onClose={() => {}} onOpenProduct={() => {}} />,
    );
    const root = container.querySelector('.zh-bs-featured')!;
    expect(root.getAttribute('aria-hidden')).toBe('true'); // closed but present
    expect(root.className).not.toContain('show');
    expect(container.querySelectorAll('.zh-bs-tile').length).toBe(3); // hero + 2 rows
    expect(container.querySelector('.zh-bs-tile.hero img')!.getAttribute('src')).toBe('/bedroom-set/lotus-banner.png');
    expect(container.querySelectorAll('.zh-bs-fdot').length).toBe(2);
    expect(container.querySelector('.zh-bs-fhead')!.getAttribute('aria-label')).toBe('پرفروش‌ترین محصولات');
  });

  it('shows when view=featured', () => {
    const { container } = render(
      <FeaturedOverlay pages={FEATURED_PAGES} view="featured" onClose={() => {}} onOpenProduct={() => {}} />,
    );
    const root = container.querySelector('.zh-bs-featured')!;
    expect(root.className).toContain('show');
    expect(root.getAttribute('aria-hidden')).toBe('false');
  });

  it('fires onOpenProduct when a tile is clicked', () => {
    const onOpenProduct = vi.fn();
    const { container } = render(
      <FeaturedOverlay pages={FEATURED_PAGES} view="featured" onClose={() => {}} onOpenProduct={onOpenProduct} />,
    );
    fireEvent.click(container.querySelector('.zh-bs-tile')!);
    expect(onOpenProduct).toHaveBeenCalledOnce();
  });
});
