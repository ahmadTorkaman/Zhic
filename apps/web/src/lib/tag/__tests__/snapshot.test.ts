// apps/web/src/lib/tag/__tests__/snapshot.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let tmp: string;
beforeEach(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tagtest-'));
  process.env.ZHIC_BACKUP_ROOT = path.join(tmp, 'backups');
  process.env.ZHIC_TAG_AUDIT = path.join(tmp, 'audit.jsonl');
  vi.resetModules(); // ensure config.ts re-reads env on next dynamic import
});
afterEach(() => fs.rmSync(tmp, { recursive: true, force: true }));

it('writeSnapshot writes {docs:[...]} per collection and returns the dir', async () => {
  const { writeSnapshot } = await import('../snapshot');
  const dir = writeSnapshot('20260615-1200-test', { designs: [{ id: 24, occupancies: ['teen'] }] });
  expect(fs.existsSync(path.join(dir, 'designs.json'))).toBe(true);
  const parsed = JSON.parse(fs.readFileSync(path.join(dir, 'designs.json'), 'utf8'));
  expect(parsed.docs[0].id).toBe(24);
});

it('listSnapshotCollections returns the collections written', async () => {
  const { writeSnapshot, listSnapshotCollections } = await import('../snapshot');
  const dir = writeSnapshot('20260615-1200-test', { designs: [{ id: 1 }], products: [{ id: 2 }] });
  expect(listSnapshotCollections(dir).sort()).toEqual(['designs', 'products']);
});

it('appendAudit appends one JSONL line per call', async () => {
  const { appendAudit } = await import('../snapshot');
  appendAudit({ ts: 't1', user_id: 6, mode: 'occupancy', op: 'set-design-occupancies', target_id: 24 });
  appendAudit({ ts: 't2', user_id: 6, mode: 'occupancy', op: 'set-design-poster', target_id: 24 });
  const lines = fs.readFileSync(process.env.ZHIC_TAG_AUDIT!, 'utf8').trim().split('\n');
  expect(lines.length).toBe(2);
  expect(JSON.parse(lines[0]!).ts).toBe('t1');
});
