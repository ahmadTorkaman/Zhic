/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '../Button';

describe('<Button variant="on-dark-solid">', () => {
  it('renders a solid ivory button with ink text', () => {
    const { container } = render(
      <Button variant="on-dark-solid">بیش‌تر درباره‌ی ما</Button>
    );
    const el = container.querySelector('button')!;
    expect(el).not.toBeNull();
    expect(el.className).toContain('bg-ivory');
    expect(el.className).toContain('text-ink');
    expect(el.className).toContain('focus-ring-invert');
  });

  it('renders as an anchor when as="a"', () => {
    const { container } = render(
      <Button as="a" href="/about" variant="on-dark-solid">x</Button>
    );
    const a = container.querySelector('a[href="/about"]')!;
    expect(a).not.toBeNull();
    expect(a.className).toContain('bg-ivory');
  });

  it('keeps the existing on-dark variant unchanged', () => {
    const { container } = render(<Button variant="on-dark">x</Button>);
    expect(container.querySelector('button')!.className).toContain('border-ivory/15');
  });
});
