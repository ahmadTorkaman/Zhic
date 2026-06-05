/** @vitest-environment jsdom */
import { beforeAll, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { StatBlock } from '../StatBlock';

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

  // jsdom doesn't implement IntersectionObserver; CountUp uses it for scroll-triggered animation
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
});

describe('<StatBlock>', () => {
  it('defaults to the gold-border look (unchanged existing consumers)', () => {
    const { container } = render(<StatBlock value={25} suffix="+" label="سال تجربه" />);
    const root = container.firstElementChild!;
    expect(root.className).toContain('border-gold');
    expect(root.className).not.toContain('stat-cell');
  });

  it('variant="divided" renders a stat-cell with ink numeral and charcoal label', () => {
    const { container } = render(
      <StatBlock variant="divided" value={1200} suffix="+" label="قطعه مبلمان تولیدشده" />
    );
    const root = container.firstElementChild!;
    expect(root.className).toContain('stat-cell');
    expect(root.className).not.toContain('border-gold');
    expect(root.querySelector('.text-ink')).not.toBeNull();
    expect(root.querySelector('.text-charcoal')).not.toBeNull();
    expect(root.textContent).toContain('قطعه مبلمان تولیدشده');
    // CountUp exposes the target value via aria-label even before animating
    expect(root.querySelector('[aria-label="1200+"]')).not.toBeNull();
  });
});
