# Pass 3: Component Expansion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build missing components from the spec inventory, extract duplicated patterns into shared modules, and fix remaining component issues — so the `@zhic/ui` library is complete for Package 1.

**Architecture:** New components are created in `packages/ui/src/`, following the existing pattern: typed props, `cn()` for class composition, token-based classes only, 720ms transitions from Pass 2. Extractions deduplicate code from `apps/web/` into `packages/ui/`. All new components use the interaction language established in Pass 2 (slow-confident transitions, forest focus rings, neutral-dominant).

**Tech Stack:** React 19, TypeScript 5, Tailwind v4 with design-system tokens, `cn()` (clsx + tailwind-merge).

**Spec reference:** `docs/superpowers/specs/2026-04-16-ui-elevation-design.md` — Pass 3, sections 3.1–3.6.

---

## Task Order

```
Task 1:  CloseButton extraction ─────── no deps
Task 2:  PayloadImage ──────────────── no deps
Task 3:  IconButton ─────────────────── no deps
Task 4:  Spinner (standalone) ─────── no deps
Task 5:  Link ───────────────────────── no deps
Task 6:  Divider ────────────────────── no deps
Task 7:  Skeleton ───────────────────── no deps
Task 8:  Toggle ─────────────────────── no deps
Task 9:  Tooltip ────────────────────── no deps
Task 10: Accordion ──────────────────── no deps
Task 11: Tabs ───────────────────────── no deps
Task 12: FilterNav ──────────────────── no deps
Task 13: Pagination promotion ────────── no deps
Task 14: Refactor consumers ──────────── after Tasks 2, 3, 10-13
Task 15: Minor component fixes ──────── no deps
Task 16: Barrel export update ────────── after all
Task 17: Build verification ──────────── after all
```

---

### Task 1: Extract CloseButton

**Files:**
- Create: `packages/ui/src/internal/CloseButton.tsx`
- Modify: `packages/ui/src/Modal.tsx`
- Modify: `packages/ui/src/Drawer.tsx`

- [ ] **Step 1: Create the shared CloseButton**

Create `packages/ui/src/internal/CloseButton.tsx`:

```tsx
import { cn } from '../cn';

export function CloseButton({
  onClick,
  label = 'بستن',
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
        'text-stone hover:bg-sand/60 hover:text-charcoal',
        'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        className,
      )}
    >
      <svg
        viewBox="0 0 14 14"
        width="14"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M1 1 L13 13 M13 1 L1 13" strokeLinecap="round" />
      </svg>
    </button>
  );
}
```

- [ ] **Step 2: Update Modal.tsx**

In `packages/ui/src/Modal.tsx`:
- Add import: `import { CloseButton } from './internal/CloseButton';`
- Delete the local `CloseButton` function (last ~20 lines)
- Replace `<CloseButton onClick={onClose} label={closeLabel} />` calls — these stay the same since the import name matches

- [ ] **Step 3: Update Drawer.tsx**

Same changes in `packages/ui/src/Drawer.tsx`:
- Add import: `import { CloseButton } from './internal/CloseButton';`
- Delete the local `CloseButton` function

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/internal/CloseButton.tsx packages/ui/src/Modal.tsx packages/ui/src/Drawer.tsx
git commit -m "refactor: extract shared CloseButton from Modal and Drawer"
```

---

### Task 2: PayloadImage component

**Files:**
- Create: `apps/web/src/components/PayloadImage.tsx`

- [ ] **Step 1: Create PayloadImage**

Create `apps/web/src/components/PayloadImage.tsx`:

```tsx
import { Aspect, type AspectRatio } from '@zhic/ui';
import { mediaUrl, type PayloadMedia } from '@/lib/payload';

interface PayloadImageProps {
  media: PayloadMedia | null | undefined;
  alt: string;
  aspect?: AspectRatio;
  fallbackText?: string;
  className?: string;
}

export function PayloadImage({
  media,
  alt,
  aspect,
  fallbackText = 'تصویر به‌زودی',
  className,
}: PayloadImageProps) {
  const src = mediaUrl(media);

  if (!src) {
    const placeholder = (
      <div className="flex h-full w-full items-center justify-center bg-cream text-small text-stone">
        {fallbackText}
      </div>
    );
    return aspect ? (
      <Aspect ratio={aspect} className={className}>
        {placeholder}
      </Aspect>
    ) : (
      <div className={className}>{placeholder}</div>
    );
  }

  const imgEl = (
    <img
      src={src}
      alt={media?.alt ?? alt}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );

  return aspect ? (
    <Aspect ratio={aspect} className={className}>
      {imgEl}
    </Aspect>
  ) : (
    <div className={className}>{imgEl}</div>
  );
}
```

Note: This lives in `apps/web/` (not `packages/ui/`) because it depends on `@/lib/payload` (the `mediaUrl` helper and `PayloadMedia` type). It will move to `packages/ui/` when the payload client is extracted to a shared package in a future session.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/PayloadImage.tsx
git commit -m "feat: add PayloadImage component for shared cover image pattern"
```

---

### Task 3: IconButton

**Files:**
- Create: `packages/ui/src/IconButton.tsx`

- [ ] **Step 1: Create IconButton**

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'default' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children'
> & {
  variant?: Variant;
  size?: Size;
  label: string;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  default: 'border border-sand bg-transparent hover:border-charcoal',
  subtle: 'bg-transparent hover:bg-cream',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export function IconButton({
  variant = 'default',
  size = 'md',
  label,
  children,
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-md',
        'text-charcoal',
        'transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/IconButton.tsx
git commit -m "feat(IconButton): add icon button with default and subtle variants"
```

---

### Task 4: Spinner (standalone)

**Files:**
- Create: `packages/ui/src/Spinner.tsx`
- Modify: `packages/ui/src/Button.tsx` (import Spinner instead of inline SVG)

- [ ] **Step 1: Create Spinner**

```tsx
import { cn } from './cn';

type Size = 'sm' | 'md' | 'lg';

export type SpinnerProps = {
  size?: Size;
  label?: string;
  className?: string;
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({
  size = 'md',
  label = 'در حال بارگذاری',
  className,
}: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-label={label}
      role="status"
      className={cn(
        'animate-spin',
        SIZE_CLASSES[size],
        className,
      )}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 2: Update Button.tsx to use Spinner**

In `packages/ui/src/Button.tsx`, find the inline spinner SVG rendered when `loading` is true. Replace it with `<Spinner size="sm" />`. Add import: `import { Spinner } from './Spinner';`

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/Spinner.tsx packages/ui/src/Button.tsx
git commit -m "feat(Spinner): extract standalone spinner, use in Button"
```

---

### Task 5: Link

**Files:**
- Create: `packages/ui/src/Link.tsx`

- [ ] **Step 1: Create Link**

```tsx
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

type Variant = 'inline' | 'standalone';

export type LinkProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'children'
> & {
  variant?: Variant;
  external?: boolean;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  inline:
    'underline underline-offset-4 decoration-sand decoration-1 hover:decoration-charcoal',
  standalone:
    'no-underline font-regular hover:font-bold',
};

export function Link({
  variant = 'inline',
  external,
  className,
  children,
  ...rest
}: LinkProps) {
  return (
    <a
      {...rest}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className={cn(
        'text-charcoal rounded-sm',
        'transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </a>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/Link.tsx
git commit -m "feat(Link): add inline and standalone link variants"
```

---

### Task 6: Divider

**Files:**
- Create: `packages/ui/src/Divider.tsx`

- [ ] **Step 1: Create Divider**

```tsx
import { cn } from './cn';

type Variant = 'subtle' | 'strong';
type Spacing = 'sm' | 'md' | 'lg';

export type DividerProps = {
  variant?: Variant;
  spacing?: Spacing;
  className?: string;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  subtle: 'border-sand',
  strong: 'border-stone',
};

const SPACING_CLASSES: Record<Spacing, string> = {
  sm: 'my-4',
  md: 'my-6',
  lg: 'my-8',
};

export function Divider({
  variant = 'subtle',
  spacing = 'md',
  className,
}: DividerProps) {
  return (
    <hr
      role="separator"
      className={cn(
        'border-t',
        VARIANT_CLASSES[variant],
        SPACING_CLASSES[spacing],
        className,
      )}
    />
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/Divider.tsx
git commit -m "feat(Divider): add subtle and strong separator"
```

---

### Task 7: Skeleton

**Files:**
- Create: `packages/ui/src/Skeleton.tsx`
- Modify: `packages/design-system/css/base.css` (add shimmer keyframe)

- [ ] **Step 1: Add shimmer keyframe to base.css**

Add before `/* ── Decorative */`:

```css
/* ── Skeleton shimmer ────────────────────────────────────────────── */

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, var(--color-cream) 25%, var(--color-sand) 50%, var(--color-cream) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-shimmer {
    animation: none;
    background: var(--color-cream);
  }
}
```

- [ ] **Step 2: Create Skeleton**

```tsx
import { cn } from './cn';

type Variant = 'text' | 'block' | 'circle';

export type SkeletonProps = {
  variant?: Variant;
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              'skeleton-shimmer h-4 rounded-md',
              i === lines - 1 ? 'w-3/5' : 'w-full',
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn('skeleton-shimmer rounded-full', className)}
        style={{ width: width ?? '48px', height: width ?? '48px' }}
      />
    );
  }

  if (variant === 'block') {
    return (
      <div
        className={cn('skeleton-shimmer rounded-md', className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <div
      className={cn('skeleton-shimmer h-4 w-full rounded-md', className)}
      style={{ width }}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/design-system/css/base.css packages/ui/src/Skeleton.tsx
git commit -m "feat(Skeleton): add loading placeholder with slow shimmer"
```

---

### Task 8: Toggle

**Files:**
- Create: `packages/ui/src/Toggle.tsx`

- [ ] **Step 1: Create Toggle**

```tsx
'use client';

import { useState, type MouseEvent } from 'react';
import { cn } from './cn';

type Size = 'sm' | 'md';

export type ToggleProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: Size;
  className?: string;
};

const TRACK_SIZE: Record<Size, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
};

const THUMB_SIZE: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
};

const THUMB_TRANSLATE: Record<Size, string> = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
};

export function Toggle({
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  disabled,
  label,
  size = 'md',
  className,
}: ToggleProps) {
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = controlledChecked !== undefined;
  const checked = isControlled ? controlledChecked : internalChecked;

  const handleClick = (e: MouseEvent) => {
    if (disabled) return;
    const next = !checked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'relative inline-flex shrink-0 cursor-pointer items-center rounded-pill',
        'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-charcoal' : 'bg-sand',
        TRACK_SIZE[size],
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none inline-block rounded-full shadow-sm',
          'transition-transform duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
          checked ? `${THUMB_TRANSLATE[size]} bg-ivory` : 'translate-x-0.5 bg-stone',
          THUMB_SIZE[size],
        )}
      />
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/Toggle.tsx
git commit -m "feat(Toggle): add switch input with neutral charcoal/sand states"
```

---

### Task 9: Tooltip

**Files:**
- Create: `packages/ui/src/Tooltip.tsx`

- [ ] **Step 1: Create Tooltip**

```tsx
'use client';

import {
  cloneElement,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';
import { useIsClient } from './useIsClient';

type Side = 'top' | 'bottom';

export type TooltipProps = {
  content: ReactNode;
  side?: Side;
  delay?: number;
  children: ReactElement;
  className?: string;
};

export function Tooltip({
  content,
  side = 'top',
  delay = 400,
  children,
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const tooltipId = useId();
  const isClient = useIsClient();

  const show = () => {
    timeoutRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const top = side === 'top' ? rect.top - 8 : rect.bottom + 8;
      const left = rect.left + rect.width / 2;
      setCoords({ top, left });
      setOpen(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setOpen(false);
  };

  const trigger = cloneElement(children, {
    ref: triggerRef,
    'aria-describedby': open ? tooltipId : undefined,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  });

  if (!isClient) return trigger;

  return (
    <>
      {trigger}
      {open
        ? createPortal(
            <div
              id={tooltipId}
              role="tooltip"
              className={cn(
                'pointer-events-none fixed z-[var(--z-toast)]',
                'rounded-md bg-ink px-3 py-2 text-small text-ivory',
                'animate-[fade-in_var(--dur-base)_var(--ease-out-soft)_both]',
                side === 'top' ? '-translate-y-full' : '',
                '-translate-x-1/2',
                className,
              )}
              style={{ top: coords.top, left: coords.left }}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
```

- [ ] **Step 2: Add fade-in keyframe to base.css** (if not already present from dialog animations)

Check if `@keyframes fade-in` exists in base.css. If not, add before decorative section:
```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/Tooltip.tsx packages/design-system/css/base.css
git commit -m "feat(Tooltip): add delayed tooltip with ink/ivory appearance"
```

---

### Task 10: Accordion

**Files:**
- Create: `packages/ui/src/Accordion.tsx`

- [ ] **Step 1: Create Accordion**

```tsx
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
        aria-labelledby={`accordion-trigger-${id}`}
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/Accordion.tsx
git commit -m "feat(Accordion): add single/multiple accordion with animated height"
```

---

### Task 11: Tabs

**Files:**
- Create: `packages/ui/src/Tabs.tsx`

- [ ] **Step 1: Create Tabs**

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/Tabs.tsx
git commit -m "feat(Tabs): add accessible tabs with forest active indicator"
```

---

### Task 12: FilterNav

**Files:**
- Create: `packages/ui/src/FilterNav.tsx`

- [ ] **Step 1: Create FilterNav**

```tsx
import { cn } from './cn';

export type FilterNavItem = {
  value: string;
  label: string;
  href: string;
};

export type FilterNavProps = {
  items: FilterNavItem[];
  activeValue?: string;
  allHref?: string;
  allLabel?: string;
  label: string;
  className?: string;
};

function PillLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex shrink-0 snap-start items-center rounded-pill px-4 py-2',
        'text-small font-medium whitespace-nowrap',
        'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
        'focus-visible:outline-none',
        active
          ? 'bg-charcoal text-ivory'
          : 'bg-cream text-charcoal hover:bg-sand',
      )}
    >
      {children}
    </a>
  );
}

export function FilterNav({
  items,
  activeValue,
  allHref,
  allLabel = 'همه',
  label,
  className,
}: FilterNavProps) {
  return (
    <nav
      aria-label={label}
      className={cn(
        'overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch]',
        className,
      )}
    >
      <div className="flex gap-2 snap-x snap-mandatory">
        {allHref && (
          <PillLink href={allHref} active={!activeValue}>
            {allLabel}
          </PillLink>
        )}
        {items.map((item) => (
          <PillLink
            key={item.value}
            href={item.href}
            active={item.value === activeValue}
          >
            {item.label}
          </PillLink>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/FilterNav.tsx
git commit -m "feat(FilterNav): add scrollable pill navigation"
```

---

### Task 13: Promote Pagination

**Files:**
- Create: `packages/ui/src/Pagination.tsx` (new version)

The current `Pagination` in `apps/web/` depends on `@/lib/products` (app-layer types). The promoted version accepts a `hrefFor` function prop instead.

- [ ] **Step 1: Create promoted Pagination in @zhic/ui**

```tsx
import { cn } from './cn';

export type PaginationProps = {
  currentPage: number;
  totalPages: number;
  hrefFor: (page: number) => string;
  formatPage?: (page: number) => string;
  className?: string;
};

function pageRange(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('gap');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push('gap');
  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  hrefFor,
  formatPage,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const display = formatPage ?? String;
  const pages = pageRange(currentPage, totalPages);

  return (
    <nav aria-label="صفحه‌بندی" className={cn('flex items-center justify-center gap-1', className)}>
      {currentPage > 1 && (
        <a
          href={hrefFor(currentPage - 1)}
          rel="prev"
          aria-label="صفحه‌ی قبل"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-stone transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:bg-cream hover:text-charcoal focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="rtl:-scale-x-100">
            <path d="M10 4 L6 8 L10 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}

      {pages.map((item, idx) =>
        item === 'gap' ? (
          <span key={`gap-${idx}`} className="px-1 text-stone" aria-hidden>
            …
          </span>
        ) : (
          <a
            key={item}
            href={hrefFor(item)}
            aria-label={`صفحه‌ی ${display(item)}`}
            aria-current={item === currentPage ? 'page' : undefined}
            className={cn(
              'inline-flex h-10 min-w-10 items-center justify-center rounded-md px-2 text-small tabular-nums',
              'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
              'focus-visible:outline-none',
              item === currentPage
                ? 'bg-charcoal text-ivory font-bold'
                : 'text-stone hover:bg-cream hover:text-charcoal',
            )}
          >
            {display(item)}
          </a>
        ),
      )}

      {currentPage < totalPages && (
        <a
          href={hrefFor(currentPage + 1)}
          rel="next"
          aria-label="صفحه‌ی بعد"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-stone transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:bg-cream hover:text-charcoal focus-visible:outline-none"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden className="rtl:-scale-x-100">
            <path d="M6 4 L10 8 L6 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/Pagination.tsx
git commit -m "feat(Pagination): promote to @zhic/ui with generic hrefFor API"
```

---

### Task 14: Refactor consumers to use new components

**Files to modify (read each first):**
- `apps/web/src/components/products/ProductGrid.tsx` — replace `ProductCover` with `<PayloadImage>`
- `apps/web/src/components/products/ProductRelatedRow.tsx` — replace `Cover` with `<PayloadImage>`
- `apps/web/src/components/showrooms/ShowroomFeaturedProductsRow.tsx` — replace `Cover` with `<PayloadImage>`
- `apps/web/src/components/home/HomeFeaturedDesigns.tsx` — replace `DesignCover` with `<PayloadImage>`
- `apps/web/src/components/home/HomeJournalTeaser.tsx` — replace `ArticleCover` with `<PayloadImage>`
- `apps/web/src/components/journal/JournalGrid.tsx` — replace `ArticleCover` with `<PayloadImage>`

For each file:
1. Add `import { PayloadImage } from '@/components/PayloadImage';`
2. Delete the local cover function
3. Replace usage with `<PayloadImage media={entity.gallery?.[0] ?? null} alt={entity.name} aspect="4/5" />` (for products) or `<PayloadImage media={article.cover} alt={article.title} fallbackText="بدون تصویر" />` (for articles)

- [ ] **Step 1: Refactor all 6 cover image consumers**

Make each replacement precisely. The `aspect` prop matches what the existing code uses — products use `"4/5"`, articles/designs let the parent card handle aspect ratio (no `aspect` prop).

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/products/ProductGrid.tsx apps/web/src/components/products/ProductRelatedRow.tsx apps/web/src/components/showrooms/ShowroomFeaturedProductsRow.tsx apps/web/src/components/home/HomeFeaturedDesigns.tsx apps/web/src/components/home/HomeJournalTeaser.tsx apps/web/src/components/journal/JournalGrid.tsx
git commit -m "refactor: replace 6 inline cover functions with PayloadImage"
```

---

### Task 15: Minor component fixes

**Files:**
- `apps/web/src/components/products/ProductPurchasePanel.tsx`
- `packages/ui/src/PhoneLink.tsx`
- `packages/ui/src/SiteFooter.tsx`
- `packages/ui/src/FormField.tsx`

- [ ] **Step 1: ProductPurchasePanel — text-display → text-h2**

In `apps/web/src/components/products/ProductPurchasePanel.tsx`, find:
```tsx
<h1 className="text-display font-bold text-charcoal text-balance">
```
Replace with:
```tsx
<h1 className="text-h2 font-bold text-charcoal text-balance">
```

- [ ] **Step 2: PhoneLink — remove dir="ltr" from Persian digit fallback**

In `packages/ui/src/PhoneLink.tsx`, find the fallback span (the one with `dir="ltr"` that wraps Persian digits). Remove the `dir="ltr"` attribute.

- [ ] **Step 3: SiteFooter — dynamic column count**

In `packages/ui/src/SiteFooter.tsx`, find:
```tsx
<div className="grid gap-10 py-10 md:grid-cols-4">
```

The `columns` prop is destructured from `SiteFooterProps`. Change to:
```tsx
<div className={cn('grid gap-10 py-10', {
  'md:grid-cols-2': columns.length === 2,
  'md:grid-cols-3': columns.length === 3,
  'md:grid-cols-4': columns.length >= 4,
})}>
```

Add `cn` import if not already present.

- [ ] **Step 4: FormField — RadioGroup compatibility**

In `packages/ui/src/FormField.tsx`, the `cloneElement` call injects `htmlFor` on a `<label>` pointing to the child's `id`. When the child is a `<RadioGroup>`, this is wrong because `<RadioGroup>` renders a `<div role="radiogroup">`, not a focusable input.

Add a `asFieldset` prop:
```tsx
export type FormFieldProps = {
  // ... existing props
  asFieldset?: boolean;
};
```

When `asFieldset` is true:
- Render `<fieldset>` instead of `<div>`, `<legend>` instead of `<label>`
- Don't inject `htmlFor` — the fieldset/legend relationship is implicit
- Still inject `aria-describedby` and `aria-invalid` onto the child

- [ ] **Step 5: ShowroomCard — pipe hours through toPersianDigits**

In `packages/ui/src/ShowroomCard.tsx`, find where `hoursSummary` is rendered. It displays time strings like `09:00 – 18:00` in ASCII digits. Pipe the value through `toPersianDigits` from `@zhic/locale` before rendering. Add the import if not present.

- [ ] **Step 6: ProductFilters — use @zhic/ui Radio and Checkbox**

In `apps/web/src/components/products/ProductFilters.tsx`, replace raw `<input type="radio" className="accent-charcoal">` with `<Radio>` from `@zhic/ui`, and raw `<input type="checkbox" className="accent-charcoal">` with `<Checkbox>` from `@zhic/ui`. Add the imports.

If the current Radio/Checkbox API requires a wrapping `<label>` that conflicts with the `<fieldset>/<legend>` structure in ProductFilters, pass the label as `children` to the Radio/Checkbox component and let it handle the label internally.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/products/ProductPurchasePanel.tsx packages/ui/src/PhoneLink.tsx packages/ui/src/SiteFooter.tsx packages/ui/src/FormField.tsx packages/ui/src/ShowroomCard.tsx apps/web/src/components/products/ProductFilters.tsx
git commit -m "fix: type token, PhoneLink bidi, SiteFooter cols, FormField fieldset, ShowroomCard digits, ProductFilters controls"
```

---

### Task 16: Barrel export update

**Files:**
- Modify: `packages/ui/src/index.ts`

- [ ] **Step 1: Add all new exports**

Add to `packages/ui/src/index.ts`:

```ts
export { IconButton } from './IconButton';
export type { IconButtonProps } from './IconButton';

export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

export { Link } from './Link';
export type { LinkProps } from './Link';

export { Divider } from './Divider';
export type { DividerProps } from './Divider';

export { Skeleton } from './Skeleton';
export type { SkeletonProps } from './Skeleton';

export { Toggle } from './Toggle';
export type { ToggleProps } from './Toggle';

export { Tooltip } from './Tooltip';
export type { TooltipProps } from './Tooltip';

export { Accordion, AccordionItem } from './Accordion';
export type { AccordionProps, AccordionItemProps } from './Accordion';

export { Tabs, TabList, Tab, TabPanel } from './Tabs';
export type { TabsProps, TabListProps, TabProps, TabPanelProps } from './Tabs';

export { FilterNav } from './FilterNav';
export type { FilterNavProps, FilterNavItem } from './FilterNav';

export { Pagination } from './Pagination';
export type { PaginationProps } from './Pagination';

export { CARD_IMAGE_ZOOM } from './cardClasses';
```

Note: `CloseButton` is intentionally NOT exported — it's internal (`./internal/CloseButton`). `PayloadImage` is in `apps/web/`, not in the barrel.

- [ ] **Step 2: Commit**

```bash
git add packages/ui/src/index.ts
git commit -m "feat: update barrel exports with all new Pass 3 components"
```

---

### Task 17: Build verification

- [ ] **Step 1: TypeScript check**

Run: `pnpm tsc --noEmit`
Expected: Clean.

- [ ] **Step 2: Verify new exports resolve**

Run: `grep -c 'export' packages/ui/src/index.ts`
Expected: significantly higher count than before (~40+ new lines).

- [ ] **Step 3: Start dev server and verify lab/ui page**

The lab/ui page should show the existing components. New components won't appear until the lab page is updated to include them — that's a follow-up, not part of this pass.

- [ ] **Step 4: Verify PayloadImage works in ProductGrid**

Navigate to `/products` — product cards should still render with their image placeholders (or real images if seeded).

- [ ] **Step 5: Final commit if needed**

```bash
git commit -m "pass3: expansion complete — verify build"
```
