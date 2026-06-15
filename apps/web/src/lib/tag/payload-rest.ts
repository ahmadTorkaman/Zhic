// apps/web/src/lib/tag/payload-rest.ts
import 'server-only';
import { PAYLOAD_API } from './config';

/** Authenticated GET against Payload REST. token = the operator's JWT. */
export async function payloadGet<T>(pathAndQuery: string, token: string): Promise<T> {
  const res = await fetch(`${PAYLOAD_API}${pathAndQuery}`, {
    headers: { Authorization: `JWT ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`payloadGet ${pathAndQuery} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** Authenticated PATCH (single document) against Payload REST. */
export async function payloadPatch(collection: 'designs' | 'products' | 'media', id: number, data: Record<string, unknown>, token: string): Promise<void> {
  const res = await fetch(`${PAYLOAD_API}/api/${collection}/${id}`, {
    method: 'PATCH',
    headers: { Authorization: `JWT ${token}`, 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`payloadPatch ${collection}/${id} -> ${res.status} ${text.slice(0, 200)}`);
  }
}
