/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RotatingHeadline } from '../RotatingHeadline';

beforeAll(() => {
  // Run rAF synchronously so the build effect's word spans materialise.
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true, configurable: true,
    value: (cb: FrameRequestCallback) => { cb(0); return 0; },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true, configurable: true, value: () => {},
  });
});

describe('<RotatingHeadline>', () => {
  it('builds one .zh-bs-rt-el per word with the title as aria-label', () => {
    const { container } = render(<RotatingHeadline title="پرفروش‌ترین محصولات" />);
    const head = container.querySelector('.zh-bs-fhead')!;
    expect(head.getAttribute('aria-label')).toBe('پرفروش‌ترین محصولات');
    const els = head.querySelectorAll('.zh-bs-rt-el');
    expect(els.length).toBe(2);
    expect(els[0]!.textContent).toBe('پرفروش‌ترین');
    expect(els[1]!.textContent).toBe('محصولات');
  });

  it('plays the in-class entrance only when active (first-open animation)', () => {
    const { container, rerender } = render(<RotatingHeadline title="پرفروش‌ترین محصولات" />);
    const head = container.querySelector('.zh-bs-fhead')!;
    expect(head.querySelectorAll('.zh-bs-rt-el.in').length).toBe(0);
    rerender(<RotatingHeadline title="پرفروش‌ترین محصولات" active />);
    expect(head.querySelectorAll('.zh-bs-rt-el.in').length).toBe(2);
  });
});
