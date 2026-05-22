/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import {
  VariantSelectionProvider,
  useVariantSelection,
} from '../VariantSelectionContext';
import type { PayloadProductVariant } from '@/lib/payload';

const variants: PayloadProductVariant[] = [
  { id: 1, product: 10, sku: 'A-120', axes: [{ key: 'size', value: '120' }], displayOrder: 0 },
  { id: 2, product: 10, sku: 'A-160', axes: [{ key: 'size', value: '160' }], displayOrder: 1 },
];

function Probe({ onState }: { onState: (state: ReturnType<typeof useVariantSelection>) => void }) {
  const state = useVariantSelection();
  onState(state);
  return null;
}

describe('<VariantSelectionProvider>', () => {
  it('seeds selectedAxes from initialVariant.axes', () => {
    let captured: ReturnType<typeof useVariantSelection> | null = null;
    render(
      <VariantSelectionProvider variants={variants} initialVariant={variants[0]!}>
        <Probe onState={(s) => (captured = s)} />
      </VariantSelectionProvider>,
    );
    expect(captured!.selectedAxes).toEqual({ size: '120' });
    expect(captured!.selectedVariant?.sku).toBe('A-120');
  });

  it('seeds empty selectedAxes when initialVariant is null', () => {
    let captured: ReturnType<typeof useVariantSelection> | null = null;
    render(
      <VariantSelectionProvider variants={variants} initialVariant={null}>
        <Probe onState={(s) => (captured = s)} />
      </VariantSelectionProvider>,
    );
    expect(captured!.selectedAxes).toEqual({});
    expect(captured!.selectedVariant).toBeNull();
  });

  it('useVariantSelection throws outside provider', () => {
    expect(() => render(<Probe onState={() => {}} />)).toThrow(/VariantSelectionProvider/);
  });
});
