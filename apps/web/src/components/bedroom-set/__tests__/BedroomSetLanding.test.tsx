/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { BedroomSetLanding } from '../BedroomSetLanding';
import { DESIGNS, FEATURED_PAGES, WRITING } from '../placeholder-data';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true, configurable: true,
    value: (query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
    }),
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true, configurable: true,
    value: (cb: FrameRequestCallback) => { cb(0); return 0; },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true, configurable: true, value: () => {},
  });
});

describe('<BedroomSetLanding>', () => {
  it('renders the stage, writing section, featured overlay, and toast together', () => {
    const { container } = render(
      <BedroomSetLanding designs={DESIGNS} pages={FEATURED_PAGES} writing={WRITING} />,
    );
    expect(container.querySelector('.zh-bs-stage')).not.toBeNull();
    expect(container.querySelector('.zh-bs-writing')).not.toBeNull();
    expect(container.querySelector('.zh-bs-featured')).not.toBeNull();
    expect(container.querySelector('.zh-bs-toast')).not.toBeNull();
    expect(container.querySelector('.zh-bs-weyebrow')!.textContent).toBe('درباره‌ی این سرویس‌ها');
    expect(container.querySelector('.zh-bs-upcue span')!.textContent).toBe('پرفروش‌ترین محصولات');
  });

  it('opens the featured overlay when the up-cue is clicked', () => {
    const { container } = render(
      <BedroomSetLanding designs={DESIGNS} pages={FEATURED_PAGES} writing={WRITING} />,
    );
    const featured = container.querySelector('.zh-bs-featured')!;
    expect(featured.className).not.toContain('show');
    fireEvent.click(container.querySelector('.zh-bs-upcue')!);
    expect(featured.className).toContain('show');
  });

  it('auto-raises the featured overlay once scrolled to the end of the writing', () => {
    let scrollY = 0;
    Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, get: () => 2000 });

    const { container } = render(
      <BedroomSetLanding designs={DESIGNS} pages={FEATURED_PAGES} writing={WRITING} />,
    );
    const featured = container.querySelector('.zh-bs-featured')!;

    // Near the top (distFromBottom = 1200) only arms — it must not open yet.
    scrollY = 0;
    fireEvent.scroll(window);
    expect(featured.className).not.toContain('show');

    // Reaching the bottom (distFromBottom = 0) while armed raises it.
    scrollY = 1200;
    fireEvent.scroll(window);
    expect(featured.className).toContain('show');
  });
});
