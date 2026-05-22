'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { resolveVariant } from '@/lib/variant-helpers';
import type { PayloadProductVariant } from '@/lib/payload';

type SelectedAxes = Record<string, string>;

type Ctx = {
  variants: PayloadProductVariant[];
  selectedAxes: SelectedAxes;
  selectedVariant: PayloadProductVariant | null;
  selectAxis: (key: string, value: string) => void;
};

const Context = createContext<Ctx | null>(null);

export function VariantSelectionProvider({
  variants,
  initialVariant,
  children,
}: {
  variants: PayloadProductVariant[];
  initialVariant: PayloadProductVariant | null;
  children: ReactNode;
}) {
  const [selectedAxes, setSelectedAxes] = useState<SelectedAxes>(() => {
    if (!initialVariant) return {};
    return Object.fromEntries(initialVariant.axes.map((a) => [a.key, a.value]));
  });

  const selectedVariant = useMemo(
    () => resolveVariant(variants, selectedAxes),
    [variants, selectedAxes],
  );

  const selectAxis = (key: string, value: string) =>
    setSelectedAxes((prev) => ({ ...prev, [key]: value }));

  return (
    <Context.Provider value={{ variants, selectedAxes, selectedVariant, selectAxis }}>
      {children}
    </Context.Provider>
  );
}

export function useVariantSelection() {
  const v = useContext(Context);
  if (!v) throw new Error('useVariantSelection must be used inside VariantSelectionProvider');
  return v;
}
