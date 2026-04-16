'use client';

import {
  createContext,
  useContext,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from './cn';

type Orientation = 'horizontal' | 'vertical';

type RadioGroupContextValue = {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type RadioGroupProps = {
  name: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  orientation?: Orientation;
  className?: string;
  children: ReactNode;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
};

export function RadioGroup({
  name,
  value,
  onValueChange,
  disabled,
  invalid,
  orientation = 'vertical',
  className,
  children,
  ...aria
}: RadioGroupProps) {
  return (
    <div
      role="radiogroup"
      aria-invalid={invalid || undefined}
      aria-disabled={disabled || undefined}
      {...aria}
      className={cn(
        orientation === 'horizontal'
          ? 'inline-flex flex-wrap items-center gap-5'
          : 'flex flex-col gap-3',
        className,
      )}
    >
      <RadioGroupContext.Provider
        value={{ name, value, onValueChange, disabled, invalid }}
      >
        {children}
      </RadioGroupContext.Provider>
    </div>
  );
}

export type RadioProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size' | 'children' | 'value'
> & {
  value: string;
  invalid?: boolean;
  children?: ReactNode;
};

export function Radio({
  value,
  children,
  className,
  disabled: disabledProp,
  invalid: invalidProp,
  name: nameProp,
  checked: checkedProp,
  onChange: onChangeProp,
  ...rest
}: RadioProps) {
  const ctx = useContext(RadioGroupContext);
  const name = nameProp ?? ctx?.name;
  const disabled = disabledProp ?? ctx?.disabled;
  const invalid = invalidProp ?? ctx?.invalid;
  const checked = ctx ? ctx.value === value : checkedProp;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChangeProp?.(event);
    if (ctx?.onValueChange && event.target.checked) {
      ctx.onValueChange(value);
    }
  };

  return (
    <label className="inline-flex items-center gap-3 text-charcoal has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          {...rest}
          aria-invalid={invalid || rest['aria-invalid'] || undefined}
          className={cn(
            'peer absolute inset-0 m-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed',
            className,
          )}
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 rounded-pill border border-charcoal bg-ivory',
            'transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]',
            'peer-hover:border-stone',
            'peer-focus-visible:border-forest peer-focus-visible:shadow-[0_0_0_var(--focus-ring-width)_var(--focus-ring-color)]',
            'peer-aria-invalid:border-rust',
          )}
        />
        <span
          aria-hidden
          className="pointer-events-none relative h-2 w-2 rounded-pill bg-charcoal opacity-0 peer-checked:opacity-100 transition-opacity duration-[var(--dur-hover)] ease-[var(--ease-out-soft)]"
        />
      </span>
      {children ? <span className="text-body">{children}</span> : null}
    </label>
  );
}
