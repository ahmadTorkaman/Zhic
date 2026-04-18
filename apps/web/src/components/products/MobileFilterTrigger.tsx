'use client';

import { useState, type ReactNode } from 'react';
import { Button, Drawer } from '@zhic/ui';

type Props = {
  children: ReactNode;
};

export function MobileFilterTrigger({ children }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        فیلترها
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        side="end"
        size="lg"
        title="فیلترها"
      >
        {children}
      </Drawer>
    </div>
  );
}
