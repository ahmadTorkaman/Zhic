// apps/web/src/lib/tag/ops.ts
import type { DesignCurrent, DesignEdit, FieldChange } from './types';

export type { DesignCurrent };

const sameSet = (a: readonly string[], b: readonly string[]) => {
  const sa = [...new Set(a)].sort().join('|');
  const sb = [...new Set(b)].sort().join('|');
  return sa === sb;
};

const sortMedia = (arr: { occupancy: string; image: number | null }[]) =>
  [...arr].sort((a, b) => a.occupancy.localeCompare(b.occupancy));

/** Build field-level changes from current state -> the UI's intended edit. */
export function buildDesignDiff(current: DesignCurrent, edit: DesignEdit): FieldChange[] {
  const changes: FieldChange[] = [];

  if (!sameSet(current.occupancies, edit.occupancies)) {
    changes.push({ collection: 'designs', id: edit.designId, field: 'occupancies', before: [...current.occupancies], after: [...edit.occupancies] });
  }

  // occupancyMedia: keep only posters whose occupancy is still asserted, preserve edit order.
  const asserted = new Set(edit.occupancies);
  const nextMedia = edit.posters
    .filter((p) => asserted.has(p.occupancy) && p.imageId != null)
    .map((p) => ({ occupancy: p.occupancy, image: p.imageId as number }));
  const curMedia = current.occupancyMedia.map((m) => ({ occupancy: m.occupancy, image: m.image }));

  if (JSON.stringify(sortMedia(nextMedia)) !== JSON.stringify(sortMedia(curMedia))) {
    changes.push({ collection: 'designs', id: edit.designId, field: 'occupancyMedia', before: curMedia, after: nextMedia });
  }
  return changes;
}

/** Reverse a change list so applying it restores the prior values (for undo). */
export function reverseChanges(changes: FieldChange[]): FieldChange[] {
  return changes.map((c) => ({ ...c, before: c.after, after: c.before }));
}

/** Deterministic-enough confirm token from the change set (guards apply against stale preview). */
export function makeConfirmToken(changes: FieldChange[], stamp: string): string {
  const body = JSON.stringify(changes.map((c) => [c.collection, c.id, c.field, c.after]));
  let h = 0;
  for (let i = 0; i < body.length; i++) h = (h * 31 + body.charCodeAt(i)) | 0;
  return `${stamp}.${(h >>> 0).toString(36)}`;
}
