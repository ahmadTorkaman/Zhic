/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

// GSAP runs real animations against rAF/layout that jsdom doesn't have.
// Stub the full surface MobileMenu uses.
vi.mock('gsap', () => {
  const timeline = () => {
    const tl: Record<string, unknown> = {};
    tl.fromTo = vi.fn(() => tl);
    tl.to = vi.fn(() => tl);
    tl.eventCallback = vi.fn(() => tl);
    tl.play = vi.fn(() => tl);
    tl.kill = vi.fn();
    return tl;
  };
  return {
    gsap: {
      set: vi.fn(),
      to: vi.fn(() => ({ kill: vi.fn() })),
      timeline: vi.fn(timeline),
    },
  };
});

import { gsap } from 'gsap';
import { MobileMenu } from '../MobileMenu';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
});

const SOCIALS = [
  { platform: 'instagram' as const, url: 'https://instagram.com/zhic' },
  { platform: 'telegram' as const, url: 'https://t.me/zhic' },
];

describe('MobileMenu (staggered)', () => {
  it('renders all six nav items with hrefs', () => {
    const { container } = render(
      <MobileMenu open onClose={() => {}} pathname="/" />,
    );
    const links = container.querySelectorAll('.zh-mm__link');
    expect(links.length).toBe(6);
    expect(links[0]!.getAttribute('href')).toBe('/bedroom-set');
    expect(links[1]!.getAttribute('href')).toBe('/bedroom-furniture');
  });

  it('marks the list for numbering', () => {
    const { container } = render(
      <MobileMenu open onClose={() => {}} pathname="/" />,
    );
    expect(container.querySelector('.zh-mm__list[data-numbering]')).not.toBeNull();
  });

  it('flags the active item with aria-current', () => {
    const { container } = render(
      <MobileMenu open onClose={() => {}} pathname="/journal" />,
    );
    const active = container.querySelector('[aria-current="page"]');
    expect(active?.getAttribute('href')).toBe('/journal');
  });

  it('renders socials when provided and omits the block when empty', () => {
    const { container, rerender } = render(
      <MobileMenu open onClose={() => {}} pathname="/" socials={SOCIALS} />,
    );
    const links = container.querySelectorAll('.zh-mm__social-link');
    expect(links.length).toBe(2);
    expect(links[0]!.textContent).toBe('اینستاگرام');
    rerender(<MobileMenu open onClose={() => {}} pathname="/" socials={[]} />);
    expect(container.querySelector('.zh-mm__socials')).toBeNull();
  });

  it('Escape calls onClose while open', () => {
    const onClose = vi.fn();
    render(<MobileMenu open onClose={onClose} pathname="/" />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('clicking a nav link calls onClose', () => {
    const onClose = vi.fn();
    const { container } = render(
      <MobileMenu open onClose={onClose} pathname="/" />,
    );
    fireEvent.click(container.querySelector('.zh-mm__link')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dialog is aria-hidden when closed', () => {
    const { container } = render(
      <MobileMenu open={false} onClose={() => {}} pathname="/" />,
    );
    expect(
      container.querySelector('[role="dialog"]')?.getAttribute('aria-hidden'),
    ).toBe('true');
  });

  it('kills the open timeline when the menu closes', () => {
    const { rerender } = render(<MobileMenu open onClose={() => {}} pathname="/" />);
    // StrictMode double-invokes effects; the last timeline call is the live one.
    const results = vi.mocked(gsap.timeline).mock.results;
    const tlInstance = results[results.length - 1]!.value;
    rerender(<MobileMenu open={false} onClose={() => {}} pathname="/" />);
    expect(tlInstance.kill).toHaveBeenCalled();
  });
});
