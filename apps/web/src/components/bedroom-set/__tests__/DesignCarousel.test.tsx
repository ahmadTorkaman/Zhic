/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { DesignCarousel } from '../DesignCarousel';
import { DESIGNS } from '../placeholder-data';

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

describe('<DesignCarousel>', () => {
  it('renders a card + dot per design, and the focused design’s name-mark via RotatingLogo', () => {
    const { container } = render(
      <DesignCarousel designs={DESIGNS} view="designs" onOpenDesign={() => {}} />,
    );
    expect(container.querySelectorAll('.zh-bs-card').length).toBe(DESIGNS.length);
    expect(container.querySelectorAll('.zh-bs-dot').length).toBe(DESIGNS.length);
    // RotatingLogo builds one name-mark at a time — the focused design's (lotus).
    const logos = container.querySelectorAll('.zh-bs-lg');
    expect(logos.length).toBe(1);
    expect(logos[0]!.getAttribute('src')).toBe(DESIGNS[0]!.logoSrc);
  });

  it('has no bottom prompt row and marks the first dot active', () => {
    const { container } = render(
      <DesignCarousel designs={DESIGNS} view="designs" onOpenDesign={() => {}} />,
    );
    expect(container.querySelector('.zh-bs-prompt')).toBeNull(); // bottom chevron + counter removed
    expect(container.querySelectorAll('.zh-bs-dot')[0]!.className).toContain('on');
  });

  it('embeds the category tabs for the focused design', () => {
    const { container } = render(
      <DesignCarousel designs={DESIGNS} view="designs" onOpenDesign={() => {}} />,
    );
    // lotus (focused 0) has occupancies [double, teen] → 2 tabs
    expect(container.querySelectorAll('.zh-bs-cat').length).toBe(2);
  });
});
