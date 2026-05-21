'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

type FilterUIState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const Ctx = createContext<FilterUIState | null>(null);

export function CategoryFilterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}

export function useCategoryFilter() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCategoryFilter must be used inside CategoryFilterProvider');
  return v;
}
