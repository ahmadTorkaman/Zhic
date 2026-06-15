// apps/web/src/lib/tag/config.ts
import os from 'node:os';
import path from 'node:path';

// Server-side internal base for Payload (NOT the public :3000 origin).
export const PAYLOAD_API = process.env.PAYLOAD_INTERNAL_URL ?? 'http://127.0.0.1:3001';
export const SESSION_COOKIE = 'tag_session';
export const BACKUP_ROOT = process.env.ZHIC_BACKUP_ROOT ?? path.join(os.homedir(), 'zhic-catalog-backups');
export const AUDIT_PATH = process.env.ZHIC_TAG_AUDIT ?? path.join(os.homedir(), 'zhic-tag-audit.jsonl');
