/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { FadeUp } from '../FadeUp';

describe('<FadeUp>', () => {
  it('renders children inside the chosen wrapper tag', () => {
    const { container } = render(
      <FadeUp as="section" className="my-cls">hello</FadeUp>
    );
    const el = container.querySelector('section.my-cls');
    expect(el).not.toBeNull();
    expect(el!.textContent).toBe('hello');
  });

  it('defaults to a div wrapper', () => {
    const { container } = render(<FadeUp>x</FadeUp>);
    expect(container.querySelector('div')).not.toBeNull();
  });

  it('applies the transitionDelay style from the delay prop', () => {
    const { container } = render(<FadeUp delay={250}>x</FadeUp>);
    const el = container.querySelector('div') as HTMLElement;
    expect(el.style.transitionDelay).toBe('250ms');
  });

  it('is immediately visible when prefers-reduced-motion is set', () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
    try {
      const { container } = render(<FadeUp>x</FadeUp>);
      const el = container.querySelector('div') as HTMLElement;
      // With reduced motion, transition should be 'none' and the element renders visible (opacity 1, transform translateY(0)).
      expect(el.style.transition).toBe('none');
      expect(el.style.opacity).toBe('1');
    } finally {
      window.matchMedia = original;
    }
  });
});
