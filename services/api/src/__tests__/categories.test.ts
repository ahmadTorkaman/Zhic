import { describe, expect, it } from 'vitest';
import { Categories } from '../collections/Categories';

describe('Categories.beforeValidate parent-cover-required', () => {
  // Find the cover-required hook (second beforeValidate hook).
  const hooks = Categories.hooks?.beforeValidate ?? [];
  // Hook order: [slugify, parentCoverRequired]
  const coverRequired = hooks[1];

  it('throws when parent (parent=null) has no cover', () => {
    if (!coverRequired) throw new Error('parentCoverRequired hook missing');
    expect(() =>
      coverRequired({ data: { name: 'تخت‌ها', parent: null, cover: null }, operation: 'create' } as never)
    ).toThrow();
  });

  it('passes when parent has a cover', () => {
    if (!coverRequired) throw new Error('parentCoverRequired hook missing');
    expect(() =>
      coverRequired({ data: { name: 'تخت‌ها', parent: null, cover: 7 }, operation: 'create' } as never)
    ).not.toThrow();
  });

  it('passes when leaf (parent set) has no cover', () => {
    if (!coverRequired) throw new Error('parentCoverRequired hook missing');
    expect(() =>
      coverRequired({ data: { name: 'تخت دونفره', parent: 3, cover: null }, operation: 'create' } as never)
    ).not.toThrow();
  });

  it('skips hook on delete operations', () => {
    if (!coverRequired) throw new Error('parentCoverRequired hook missing');
    expect(() =>
      coverRequired({ data: { name: 'تخت‌ها', parent: null, cover: null }, operation: 'delete' } as never)
    ).not.toThrow();
  });
});
