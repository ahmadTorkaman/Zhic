// apps/web/src/lib/tag/__tests__/media-ops.test.ts
import { describe, it, expect } from 'vitest';
import { buildMediaDiff } from '../ops';
import type { MediaEdit } from '../types';

const current = { mediaId: 5, alt: null, caption: null, decorative: false };

describe('buildMediaDiff', () => {
  it('no change when alt empty↔null, caption empty, decorative false', () => {
    const edit: MediaEdit = { mediaId: 5, alt: '', caption: '', decorative: false };
    expect(buildMediaDiff(current, edit)).toEqual([]);
  });
  it('alt-only change', () => {
    const edit: MediaEdit = { mediaId: 5, alt: 'کمد ورنا', caption: null, decorative: false };
    const c = buildMediaDiff(current, edit);
    expect(c).toHaveLength(1);
    expect(c[0]!).toMatchObject({ collection: 'media', id: 5, field: 'alt', after: 'کمد ورنا' });
  });
  it('all three change', () => {
    const edit: MediaEdit = { mediaId: 5, alt: 'x', caption: 'y', decorative: true };
    expect(buildMediaDiff(current, edit).map((c) => c.field).sort()).toEqual(['alt', 'caption', 'decorative']);
  });
});
