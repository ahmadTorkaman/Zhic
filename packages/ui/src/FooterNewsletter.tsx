'use client';

import { useState, type FormEvent } from 'react';
import { Button } from './Button';
import { Input } from './Input';

export type FooterNewsletterProps = {
  placeholder?: string;
  submitLabel?: string;
};

export function FooterNewsletter({
  placeholder = 'شماره موبایل',
  submitLabel = 'عضویت',
}: FooterNewsletterProps) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    setSubmitted(true);
    setValue('');
    if (typeof console !== 'undefined') {
      console.info('[newsletter] stub submit:', value);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch"
    >
      <div className="flex-1">
        <Input
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="border-ivory/20 bg-ivory/5 text-ivory placeholder:text-ivory/40 focus-visible:ring-ivory focus-visible:ring-offset-charcoal focus-visible:border-ivory"
        />
      </div>
      <Button type="submit" variant="primary">
        {submitLabel}
      </Button>
      {submitted ? (
        <p
          aria-live="polite"
          className="text-small text-ivory/60 sm:basis-full"
        >
          دریافت شد — به‌زودی با شما تماس می‌گیریم.
        </p>
      ) : null}
    </form>
  );
}
