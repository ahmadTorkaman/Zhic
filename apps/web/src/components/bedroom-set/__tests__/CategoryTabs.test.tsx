/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { CategoryTabs } from '../CategoryTabs';

describe('<CategoryTabs> (controlled)', () => {
  it('renders one kashida pill per occupancy in canonical order and highlights `active`', () => {
    const { container } = render(
      <CategoryTabs occupancies={['double', 'baby', 'teen']} active="teen" onSelect={() => {}} />,
    );
    const pills = [...container.querySelectorAll('.zh-bs-cat')];
    expect(pills.map((p) => p.textContent)).toEqual(['نـــــوزاد', 'نـــــوجوان', 'دونـــــفره']); // canonical, not prop order
    expect(pills.find((p) => p.textContent === 'نـــــوجوان')!.className).toContain('on');
    expect(pills.find((p) => p.textContent === 'نـــــوزاد')!.className).not.toContain('on');
  });

  it('shows only the occupancies the design has (no نوزاد here)', () => {
    const { container } = render(
      <CategoryTabs occupancies={['double', 'teen']} active="teen" onSelect={() => {}} />,
    );
    expect([...container.querySelectorAll('.zh-bs-cat')].map((p) => p.textContent)).toEqual(['نـــــوجوان', 'دونـــــفره']);
  });

  it('calls onSelect with the clicked occupancy', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <CategoryTabs occupancies={['baby', 'teen', 'double']} active="baby" onSelect={onSelect} />,
    );
    fireEvent.click(container.querySelectorAll('.zh-bs-cat')[2]!); // دونفره
    expect(onSelect).toHaveBeenCalledWith('double');
  });
});
