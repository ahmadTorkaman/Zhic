/** @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';
import { CategoryTabs } from '../CategoryTabs';

describe('<CategoryTabs> (controlled)', () => {
  const noop = () => {};

  it('renders one kashida pill per occupancy in canonical order and highlights `active`', () => {
    const { container } = render(
      <CategoryTabs occupancies={['double', 'baby', 'teen']} active="teen" onPreview={noop} onOpen={noop} />,
    );
    const pills = [...container.querySelectorAll('.zh-bs-cat')];
    expect(pills.map((p) => p.textContent)).toEqual(['نـــــوزاد', 'نـــــوجوان', 'دونـــــفره']); // canonical, not prop order
    expect(pills.find((p) => p.textContent === 'نـــــوجوان')!.className).toContain('on');
    expect(pills.find((p) => p.textContent === 'نـــــوزاد')!.className).not.toContain('on');
  });

  it('shows only the occupancies the design has (no نوزاد here)', () => {
    const { container } = render(
      <CategoryTabs occupancies={['double', 'teen']} active="teen" onPreview={noop} onOpen={noop} />,
    );
    expect([...container.querySelectorAll('.zh-bs-cat')].map((p) => p.textContent)).toEqual(['نـــــوجوان', 'دونـــــفره']);
  });

  it('calls onOpen with the clicked occupancy (navigates to the filtered design page)', () => {
    const onOpen = vi.fn();
    const { container } = render(
      <CategoryTabs occupancies={['baby', 'teen', 'double']} active="baby" onPreview={noop} onOpen={onOpen} />,
    );
    fireEvent.click(container.querySelectorAll('.zh-bs-cat')[2]!); // دونفره
    expect(onOpen).toHaveBeenCalledWith('double');
  });

  it('previews on mouse hover and clears on leave', () => {
    const onPreview = vi.fn();
    const { container } = render(
      <CategoryTabs occupancies={['baby', 'teen']} active="baby" onPreview={onPreview} onOpen={noop} />,
    );
    const teen = container.querySelectorAll('.zh-bs-cat')[1]!;
    fireEvent.pointerEnter(teen, { pointerType: 'mouse' });
    expect(onPreview).toHaveBeenCalledWith('teen');
    fireEvent.pointerLeave(teen, { pointerType: 'mouse' });
    expect(onPreview).toHaveBeenLastCalledWith(null);
  });

  it('does NOT preview on touch (pointerType touch)', () => {
    const onPreview = vi.fn();
    const { container } = render(
      <CategoryTabs occupancies={['baby', 'teen']} active="baby" onPreview={onPreview} onOpen={noop} />,
    );
    fireEvent.pointerEnter(container.querySelectorAll('.zh-bs-cat')[1]!, { pointerType: 'touch' });
    expect(onPreview).not.toHaveBeenCalled();
  });
});
