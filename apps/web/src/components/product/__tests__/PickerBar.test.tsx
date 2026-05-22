/** @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { VariantSelectionProvider } from '../VariantSelectionContext';
import { PickerBar } from '../PickerBar';
import type { PayloadProduct, PayloadProductVariant } from '@/lib/payload';

const product = {
  id: 10,
  slug: 'gandom-bed',
  name: 'تخت گندم',
  basePriceRials: 100000000,
} as PayloadProduct;

const variants: PayloadProductVariant[] = [
  { id: 1, product: 10, sku: 'A-120-H', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 0, displayOrder: 0 },
  { id: 2, product: 10, sku: 'A-120-L', axes: [{ key: 'size', value: '120' }, { key: 'footboard', value: 'low' }], priceDeltaRials: -6000000, displayOrder: 1 },
  { id: 3, product: 10, sku: 'A-160-H', axes: [{ key: 'size', value: '160' }, { key: 'footboard', value: 'high' }], priceDeltaRials: 80000000, displayOrder: 2 },
];

function Wrap({ children, initial = variants[0]! }: { children: React.ReactNode; initial?: PayloadProductVariant | null }) {
  return (
    <VariantSelectionProvider variants={variants} initialVariant={initial}>
      {children}
    </VariantSelectionProvider>
  );
}

describe('<PickerBar>', () => {
  it('renders one radiogroup per allowed axis', () => {
    const { container } = render(
      <Wrap>
        <PickerBar product={product} variants={variants} allowedAxes={['size', 'footboard']} />
      </Wrap>,
    );
    const groups = container.querySelectorAll('[role="radiogroup"]');
    expect(groups.length).toBe(2);
  });

  it('marks the active chip with aria-checked="true"', () => {
    const { container } = render(
      <Wrap>
        <PickerBar product={product} variants={variants} allowedAxes={['size', 'footboard']} />
      </Wrap>,
    );
    const activeChips = container.querySelectorAll('[role="radio"][aria-checked="true"]');
    // 1 active chip per axis = 2 active chips total
    expect(activeChips.length).toBe(2);
  });

  it('renders 0 radiogroups when allowedAxes is empty (single-SKU products)', () => {
    const { container } = render(
      <Wrap>
        <PickerBar product={product} variants={[]} allowedAxes={[]} />
      </Wrap>,
    );
    expect(container.querySelectorAll('[role="radiogroup"]').length).toBe(0);
  });

  it('shows the CTA always (single-SKU and multi-variant products alike)', () => {
    const { container } = render(
      <Wrap initial={null}>
        <PickerBar product={product} variants={[]} allowedAxes={[]} />
      </Wrap>,
    );
    const cta = container.querySelector('button[type="button"]');
    expect(cta?.textContent).toContain('استعلام قیمت');
  });
});
