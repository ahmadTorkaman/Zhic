/**
 * Single source of truth for the bedroom-set occupancy enum
 * (baby / teen / double / bunk) — the «گروه سرویس خواب» age groups.
 *
 * Imported by every collection that exposes an occupancy `select`
 * (Products, Designs, SeriesOccupancies, BedroomSetHubs) so the option
 * list + Persian labels never drift. Note: Payload still generates a
 * SEPARATE per-field DB enum for each usage — this only de-duplicates the
 * option definitions in code, so adding a 5th occupancy is a one-line change
 * here (plus a per-field enum migration).
 *
 * Kept as a plain (mutable) array so it satisfies Payload's `options:` type.
 */
export const OCCUPANCY_OPTIONS = [
  { label: 'سرویس خواب نوزاد', value: 'baby' },
  { label: 'سرویس خواب نوجوان', value: 'teen' },
  { label: 'سرویس خواب دونفره', value: 'double' },
  { label: 'سرویس خواب دوطبقه', value: 'bunk' },
]

export type OccupancyValue = 'baby' | 'teen' | 'double' | 'bunk'
