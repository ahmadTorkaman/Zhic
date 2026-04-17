'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { cn } from './cn';

type AccordionType = 'single' | 'multiple';

type AccordionContextValue = {
  type: AccordionType;
  openItems: Set<string>;
  toggle: (id: string) => void;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);

export type AccordionProps = {
  type?: AccordionType;
  defaultOpen?: string[];
  children: ReactNode;
  className?: string;
};

export function Accordion({
  type = 'multiple',
  defaultOpen = [],
  children,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(
    () => new Set(defaultOpen),
  );

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (type === 'single') next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn('divide-y divide-sand', className)}>
      <AccordionContext.Provider value={{ type, openItems, toggle }}>
        {children}
      </AccordionContext.Provider>
    </div>
  );
}

export type AccordionItemProps = {
  id: string;
  title: ReactNode;
  children: ReactNode;
  disabled?: boolean;
  icon?: 'chevron' | 'plus';
  className?: string;
};

export function AccordionItem({
  id,
  title,
  children,
  disabled,
  icon = 'chevron',
  className,
}: AccordionItemProps) {
  const ctx = useContext(AccordionContext);
  const isOpen = ctx?.openItems.has(id) ?? false;

  const handleToggle = () => {
    if (disabled) return;
    ctx?.toggle(id);
  };

  return (
    <div className={cn('py-4', className)}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-controls={`accordion-panel-${id}`}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-4 text-start',
          'text-body font-bold text-charcoal',
          'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
          'hover:text-ink',
          'focus-visible:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <span>{title}</span>
        {icon === 'chevron' ? (
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
            className={cn(
              'shrink-0 text-stone transition-transform duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
              isOpen && 'rotate-180',
            )}
          >
            <path d="M4 6 L8 10 L12 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 16 16"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
            className={cn(
              'shrink-0 text-stone transition-transform duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
              isOpen && 'rotate-45',
            )}
          >
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
        )}
      </button>
      <div
        id={`accordion-panel-${id}`}
        role="region"
        className={cn(
          'grid transition-[grid-template-rows] duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-3 text-body text-stone">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
