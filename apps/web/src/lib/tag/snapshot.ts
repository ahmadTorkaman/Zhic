// apps/web/src/lib/tag/snapshot.ts
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { BACKUP_ROOT, AUDIT_PATH } from './config';

/** Write a per-collection JSON snapshot in Payload's {docs:[...]} envelope. Returns the dir. */
export function writeSnapshot(label: string, byCollection: Record<string, unknown[]>): string {
  const dir = path.join(BACKUP_ROOT, `tag-${label}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const [collection, docs] of Object.entries(byCollection)) {
    fs.writeFileSync(path.join(dir, `${collection}.json`), JSON.stringify({ docs, totalDocs: docs.length }, null, 2), 'utf8');
  }
  return dir;
}

export function readSnapshot(dir: string, collection: string): { docs: Record<string, unknown>[] } {
  return JSON.parse(fs.readFileSync(path.join(dir, `${collection}.json`), 'utf8'));
}

/** Collections present in a snapshot dir (e.g. ['designs','products']) by reading *.json filenames. */
export function listSnapshotCollections(dir: string): string[] {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
}

export function appendAudit(entry: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(AUDIT_PATH), { recursive: true });
  fs.appendFileSync(AUDIT_PATH, JSON.stringify(entry) + '\n', 'utf8');
}
