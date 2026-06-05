/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { CategoryTabs } from '../CategoryTabs';

describe('<CategoryTabs>', () => {
  it('renders the three kashida-stretched room pills, first active', () => {
    const { container } = render(<CategoryTabs />);
    const pills = container.querySelectorAll('.zh-bs-cat');
    expect(pills.length).toBe(3);
    expect(pills[0]!.textContent).toBe('نـــــوزاد');
    expect(pills[0]!.className).toContain('on');
    expect(pills[1]!.className).not.toContain('on');
  });

  it('moves the active recess to a clicked pill', () => {
    const { container } = render(<CategoryTabs />);
    const pills = container.querySelectorAll<HTMLButtonElement>('.zh-bs-cat');
    fireEvent.click(pills[2]!);
    expect(pills[2]!.className).toContain('on');
    expect(pills[0]!.className).not.toContain('on');
  });
});
