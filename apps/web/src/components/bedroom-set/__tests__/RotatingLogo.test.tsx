/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { RotatingLogo } from '../RotatingLogo';

beforeEach(() => {
  vi.useFakeTimers();
  // rAF synchronous so the .in slide-in class is applied immediately
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('<RotatingLogo>', () => {
  it('builds the current name-mark and slides it in', () => {
    const { container } = render(<RotatingLogo src="/a.webp" />);
    const img = container.querySelector('.zh-bs-lg');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toContain('/a.webp');
    expect(img!.classList.contains('in')).toBe(true);
  });

  it('renders nothing when the design has no name-mark', () => {
    const { container } = render(<RotatingLogo src={undefined} />);
    expect(container.querySelector('.zh-bs-lg')).toBeNull();
  });

  it('slides the old name-mark out first, then builds the new one from below after the beat', () => {
    const { container, rerender } = render(<RotatingLogo src="/a.webp" />);
    rerender(<RotatingLogo src="/b.webp" />);

    // the old mark is immediately marked .out; the new one is NOT built yet (sequential)
    const out = container.querySelector('.zh-bs-lg.out');
    expect(out).not.toBeNull();
    expect(out!.getAttribute('src')).toContain('/a.webp');
    expect(container.querySelectorAll('.zh-bs-lg').length).toBe(1);

    // after the 430ms beat, the next mark is built and slides in
    act(() => { vi.advanceTimersByTime(430); });
    const next = container.querySelector('.zh-bs-lg');
    expect(next!.getAttribute('src')).toContain('/b.webp');
    expect(next!.classList.contains('in')).toBe(true);
    expect(container.querySelectorAll('.zh-bs-lg').length).toBe(1);
  });
});
