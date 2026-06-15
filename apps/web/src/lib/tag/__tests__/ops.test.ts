// apps/web/src/lib/tag/__tests__/ops.test.ts
import { describe, it, expect } from 'vitest';
import { buildDesignDiff, reverseChanges, makeConfirmToken } from '../ops';
import type { DesignEdit, DesignCurrent } from '../types';

const current: DesignCurrent = {
  designId: 24,
  occupancies: ['teen', 'double'],
  occupancyMedia: [
    { occupancy: 'teen', image: 101 },
    { occupancy: 'double', image: 102 },
  ],
};

describe('buildDesignDiff', () => {
  it('emits no changes when edit matches current', () => {
    const edit: DesignEdit = {
      designId: 24,
      occupancies: ['teen', 'double'],
      posters: [{ occupancy: 'teen', imageId: 101 }, { occupancy: 'double', imageId: 102 }],
    };
    expect(buildDesignDiff(current, edit)).toEqual([]);
  });

  it('detects occupancy add + poster change, order-insensitive for occupancies', () => {
    const edit: DesignEdit = {
      designId: 24,
      occupancies: ['double', 'teen', 'baby'],
      posters: [{ occupancy: 'teen', imageId: 999 }, { occupancy: 'double', imageId: 102 }, { occupancy: 'baby', imageId: 500 }],
    };
    const changes = buildDesignDiff(current, edit);
    const occ = changes.find((c) => c.field === 'occupancies')!;
    expect([...(occ.after as string[])].sort()).toEqual(['baby', 'double', 'teen']);
    const media = changes.find((c) => c.field === 'occupancyMedia')!;
    expect(media.after).toEqual([
      { occupancy: 'teen', image: 999 },
      { occupancy: 'double', image: 102 },
      { occupancy: 'baby', image: 500 },
    ]);
  });

  it('drops posters whose occupancy is no longer asserted', () => {
    const edit: DesignEdit = {
      designId: 24,
      occupancies: ['teen'],
      posters: [{ occupancy: 'teen', imageId: 101 }],
    };
    const changes = buildDesignDiff(current, edit);
    expect((changes.find((c) => c.field === 'occupancyMedia')!.after as unknown[]).length).toBe(1);
  });

  it('treats same occupancyMedia pairs in different order as no change', () => {
    const edit: DesignEdit = {
      designId: 24,
      occupancies: ['teen', 'double'],
      posters: [{ occupancy: 'double', imageId: 102 }, { occupancy: 'teen', imageId: 101 }],
    };
    expect(buildDesignDiff(current, edit)).toEqual([]);
  });
});

describe('reverseChanges', () => {
  it('swaps before/after so applying it restores prior state', () => {
    const changes = [{ collection: 'designs' as const, id: 24, field: 'occupancies' as const, before: ['teen'], after: ['teen', 'baby'] }];
    expect(reverseChanges(changes)).toEqual([{ collection: 'designs', id: 24, field: 'occupancies', before: ['teen', 'baby'], after: ['teen'] }]);
  });
});

describe('makeConfirmToken', () => {
  it('identical inputs produce identical token', () => {
    expect(makeConfirmToken([], 'ts1')).toBe(makeConfirmToken([], 'ts1'));
  });

  it('differing changes produce differing token', () => {
    const t1 = makeConfirmToken([], 'ts1');
    const t2 = makeConfirmToken([{ collection: 'designs', id: 1, field: 'occupancies', before: [], after: ['baby'] }], 'ts1');
    expect(t1).not.toBe(t2);
  });
});
