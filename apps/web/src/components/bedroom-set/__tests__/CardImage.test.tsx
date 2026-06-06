/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { CardImage } from '../CardImage';

afterEach(() => { vi.useRealTimers(); });

describe('<CardImage>', () => {
  it('shows the initial banner instantly (no dissolve layer)', () => {
    const { container } = render(<CardImage src="/a.webp" alt="x" />);
    const imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(1);
    expect(imgs[0]!.className).toBe(''); // initial → no fade-in animation
    expect(imgs[0]!.getAttribute('src')).toContain('/a.webp');
  });

  it('dissolves into the new banner, then collapses to one layer', () => {
    vi.useFakeTimers();
    const { container, rerender } = render(<CardImage src="/a.webp" alt="x" />);
    rerender(<CardImage src="/b.webp" alt="x" />);

    // the incoming banner stacks over the current one (which stays underneath)
    let imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(2);
    expect(imgs[0]!.getAttribute('src')).toContain('/a.webp'); // old kept opaque underneath
    expect(imgs[1]!.className).toContain('zh-bs-dissolve');
    expect(imgs[1]!.getAttribute('src')).toContain('/b.webp');

    // once it has faded in, the layers beneath are dropped
    act(() => { vi.advanceTimersByTime(600); });
    imgs = container.querySelectorAll('img');
    expect(imgs.length).toBe(1);
    expect(imgs[0]!.getAttribute('src')).toContain('/b.webp');
  });

  it('does not add a layer when the src is unchanged', () => {
    const { container, rerender } = render(<CardImage src="/a.webp" alt="x" />);
    rerender(<CardImage src="/a.webp" alt="x" />);
    expect(container.querySelectorAll('img').length).toBe(1);
  });
});
