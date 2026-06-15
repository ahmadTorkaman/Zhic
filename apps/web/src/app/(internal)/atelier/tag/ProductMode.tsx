// apps/web/src/app/(internal)/atelier/tag/ProductMode.tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { OCCUPANCIES, OCCUPANCY_FA, type Occupancy } from '@/lib/tag/types';
import { toPersianDigits } from '@zhic/locale';
import { ModeNav } from './ModeNav';

type ProductRow = { productId: number; title: string; designSlug: string | null; designTitle: string | null; occupancies: Occupancy[] };

export function ProductMode() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [focus, setFocus] = useState(0);
  const [lastBackupDir, setLastBackupDir] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/tag/state?mode=product', { cache: 'no-store' });
    const data = await res.json();
    setProducts(data.products);
  }, []);
  useEffect(() => { load(); }, [load]);

  const cur = products[focus];
  // Live per-age distribution from the in-memory (possibly-edited) product list — the "224 → N" deltas.
  const dist = (o: Occupancy) => products.filter((p) => p.occupancies.includes(o)).length;

  const toggle = (o: Occupancy) => setProducts((ps) => ps.map((p, i) => i !== focus ? p : {
    ...p, occupancies: p.occupancies.includes(o) ? p.occupancies.filter((x) => x !== o) : [...p.occupancies, o],
  }));

  const save = useCallback(async () => {
    if (!cur) return;
    setStatus('در حال ذخیره…');
    try {
      const pvRes = await fetch('/api/tag/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: 'product', edits: [{ productId: cur.productId, occupancies: cur.occupancies }] }) });
      const pv = await pvRes.json();
      if (!pvRes.ok) { setStatus(`خطا: ${pv.error ?? pvRes.status}`); return; }
      if (!pv.changes?.length) { setStatus('تغییری نیست'); return; }
      const apRes = await fetch('/api/tag/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pv) });
      const ap = await apRes.json();
      if (apRes.ok && ap.applied) { setLastBackupDir(ap.backupDir); setStatus(`ذخیره شد (${ap.backupDir.split('/').pop()})`); }
      else { setStatus(`خطا: ${ap.error ?? apRes.status}`); }
      await load();
    } catch { setStatus('خطا در ذخیره‌سازی'); }
  }, [cur, load]);

  const undo = useCallback(async () => {
    if (!lastBackupDir) { setStatus('چیزی برای بازگردانی نیست'); return; }
    setStatus('در حال بازگردانی…');
    try {
      const res = await fetch('/api/tag/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ backupDir: lastBackupDir }) });
      const data = await res.json();
      setStatus(res.ok ? `بازگردانی شد (${data.restored})` : `خطا: ${data.error ?? ''}`);
      setLastBackupDir(null);
      await load();
    } catch { setStatus('خطا در بازگردانی'); }
  }, [lastBackupDir, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => Math.min(f + 1, products.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => Math.max(f - 1, 0)); }
      else if (['1', '2', '3', '4'].includes(e.key)) { const o = OCCUPANCIES[Number(e.key) - 1]; if (o) toggle(o); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      else if (e.key === 'Z' || e.key === 'z') { undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [products.length, save, undo]);

  if (!cur) return <main className="zh-tag"><ModeNav active="product" /><p>در حال بارگذاری…</p></main>;

  return (
    <main className="zh-tag">
      <ModeNav active="product" />
      <div className="zh-tag-score" role="status">
        {OCCUPANCIES.map((o) => <span key={o} className="zh-tag-score__chip">{OCCUPANCY_FA[o]}: {toPersianDigits(dist(o))}</span>)}
        <span className="zh-tag-score__chip">کل: {toPersianDigits(products.length)} محصول</span>
      </div>
      <div className="zh-tag__cols">
        <ul className="zh-tag__list">
          {products.map((p, i) => (
            <li key={p.productId} aria-current={i === focus} className={`zh-tag__row${i === focus ? ' is-focus' : ''}`} onClick={() => setFocus(i)}>
              <span>{p.title}{p.designTitle ? ` — ${p.designTitle}` : ''}</span>
              <span className="zh-tag__dots">{OCCUPANCIES.map((o) => <i key={o} className={`zh-tag__dot${p.occupancies.includes(o) ? ' is-set' : ''}`} title={OCCUPANCY_FA[o]} />)}</span>
            </li>
          ))}
        </ul>
        <section className="zh-tag__center">
          <h2>{cur.title}</h2>
          {cur.designTitle ? <p className="zh-tag__status">طرح: {cur.designTitle}</p> : null}
          <div className="zh-tag__ages">
            {OCCUPANCIES.map((o, idx) => (
              <button key={o} className={`zh-tag__age${cur.occupancies.includes(o) ? ' is-on' : ''}`} onClick={() => toggle(o)}>
                {OCCUPANCY_FA[o]} <kbd>{idx + 1}</kbd>
              </button>
            ))}
          </div>
          <div className="zh-tag__actions">
            <button className="zh-tag__age" onClick={save}>ذخیره <kbd>⌘S</kbd></button>
            <button className="zh-tag__age" onClick={undo} disabled={!lastBackupDir}>بازگردانی <kbd>Z</kbd></button>
          </div>
          <p className="zh-tag__status" role="status">{status}</p>
        </section>
      </div>
    </main>
  );
}
