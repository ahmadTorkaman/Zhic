/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { CategoryTabs } from '../CategoryTabs';

describe('<CategoryTabs>', () => {
  it('renders one kashida pill per occupancy in canonical order, first active', () => {
    const { container } = render(<CategoryTabs occupancies={['baby', 'teen', 'double']} />);
    const pills = container.querySelectorAll('.zh-bs-cat');
    expect([...pills].map((p) => p.textContent)).toEqual(['نـــــوزاد', 'نـــــوجوان', 'دونـــــفره']);
    expect(pills[0]!.className).toContain('on');
    expect(pills[1]!.className).not.toContain('on');
  });

  it('shows only the occupancies the design has, in canonical order (ignoring prop order)', () => {
    const { container } = render(<CategoryTabs occupancies={['double', 'teen']} />);
    const pills = container.querySelectorAll('.zh-bs-cat');
    expect([...pills].map((p) => p.textContent)).toEqual(['نـــــوجوان', 'دونـــــفره']); // no نوزاد
  });

  it('moves the active recess to a clicked pill', () => {
    const { container } = render(<CategoryTabs occupancies={['baby', 'teen', 'double']} />);
    const pills = container.querySelectorAll<HTMLButtonElement>('.zh-bs-cat');
    fireEvent.click(pills[2]!);
    expect(pills[2]!.className).toContain('on');
    expect(pills[0]!.className).not.toContain('on');
  });

  it('updates the pills when the focused design changes', () => {
    const { container, rerender } = render(<CategoryTabs occupancies={['baby', 'teen', 'double']} />);
    expect(container.querySelectorAll('.zh-bs-cat').length).toBe(3);
    rerender(<CategoryTabs occupancies={['double']} />); // swipe to a double-only design
    const pills = container.querySelectorAll('.zh-bs-cat');
    expect(pills.length).toBe(1);
    expect(pills[0]!.textContent).toBe('دونـــــفره');
    expect(pills[0]!.className).toContain('on'); // active fell back to the only option
  });

  it('keeps the selected room-type across designs when still offered', () => {
    const { container, rerender } = render(<CategoryTabs occupancies={['baby', 'teen', 'double']} />);
    const pills = container.querySelectorAll<HTMLButtonElement>('.zh-bs-cat');
    fireEvent.click(pills[1]!); // select «نوجوان» (teen)
    expect(pills[1]!.className).toContain('on');
    rerender(<CategoryTabs occupancies={['teen', 'double']} />); // another design that still offers teen
    const next = container.querySelectorAll('.zh-bs-cat');
    expect(next[0]!.textContent).toBe('نـــــوجوان');
    expect(next[0]!.className).toContain('on'); // teen stayed selected
  });
});
