'use client';

import {
  createContext,
  useContext,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from './cn';

type TabsContextValue = {
  activeValue: string;
  setActiveValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export type TabsProps = {
  defaultValue: string;
  children: ReactNode;
  className?: string;
};

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeValue, setActiveValue] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeValue, setActiveValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export type TabListProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function TabList({ label, children, className }: TabListProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
    );
    const current = tabs.findIndex((t) => t === document.activeElement);
    if (current < 0) return;

    let next = current;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const dir = document.documentElement.getAttribute('dir') === 'rtl' ? -1 : 1;
      const delta = e.key === 'ArrowRight' ? dir : -dir;
      next = (current + delta + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      next = 0;
    } else if (e.key === 'End') {
      next = tabs.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn('flex gap-1 border-b border-sand', className)}
    >
      {children}
    </div>
  );
}

export type TabProps = {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
};

export function Tab({ value, children, disabled, className }: TabProps) {
  const ctx = useContext(TabsContext);
  const active = ctx?.activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={`tabpanel-${value}`}
      tabIndex={active ? 0 : -1}
      disabled={disabled}
      onClick={() => ctx?.setActiveValue(value)}
      className={cn(
        'relative px-4 py-3 text-small',
        'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        active
          ? 'font-bold text-charcoal'
          : 'font-regular text-stone hover:text-charcoal',
        className,
      )}
    >
      {children}
      {active && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[1.5px] bg-forest"
        />
      )}
    </button>
  );
}

export type TabPanelProps = {
  value: string;
  children: ReactNode;
  className?: string;
};

export function TabPanel({ value, children, className }: TabPanelProps) {
  const ctx = useContext(TabsContext);
  const active = ctx?.activeValue === value;

  if (!active) return null;

  return (
    <div
      id={`tabpanel-${value}`}
      role="tabpanel"
      tabIndex={0}
      className={cn('pt-4', className)}
    >
      {children}
    </div>
  );
}
