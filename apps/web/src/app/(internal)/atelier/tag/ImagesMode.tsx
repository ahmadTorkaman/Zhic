// apps/web/src/app/(internal)/atelier/tag/ImagesMode.tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { toPersianDigits } from '@zhic/locale';
import { altFromContext } from '@/lib/tag/alt-gen';
import { ModeNav } from './ModeNav';

type Img = {
  id: number; url: string; thumbnailURL: string | null; filename: string;
  alt: string | null; caption: string | null; decorative: boolean;
  inUse: boolean; ctx: { pieceType: string | null; designName: string | null; productName: string | null; productSlug: string | null } | null;
};

export function ImagesMode() {
  const [images, setImages] = useState<Img[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [needsAlt, setNeedsAlt] = useState(true);
  const [focus, setFocus] = useState(0);
  const [status, setStatus] = useState('');
  const [lastBackupDir, setLastBackupDir] = useState<string | null>(null);

  const load = useCallback(async (p: number, filterNeedsAlt: boolean) => {
    const q = `?mode=images&page=${p}${filterNeedsAlt ? '&filter=needs-alt' : ''}`;
    const res = await fetch(`/api/tag/state${q}`, { cache: 'no-store' });
    const d = await res.json();
    setImages(d.images); setTotal(d.total); setTotalPages(d.totalPages); setPage(d.page); setFocus(0);
  }, []);
  useEffect(() => { load(page, needsAlt); }, [load, page, needsAlt]);

  const cur = images[focus];

  const patch = (id: number, fields: Partial<Pick<Img, 'alt' | 'caption' | 'decorative'>>) =>
    setImages((xs) => xs.map((x) => x.id === id ? { ...x, ...fields } : x));

  const regenerate = (img: Img) => {
    if (!img.ctx) { setStatus('بدون محصول مرجع — تولید خودکار ممکن نیست'); return; }
    patch(img.id, { alt: altFromContext({ filename: img.filename, ...img.ctx }) });
  };

  const save = useCallback(async (img: Img) => {
    setStatus('در حال ذخیره…');
    try {
      const pvRes = await fetch('/api/tag/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'images', edits: [{ mediaId: img.id, alt: img.alt, caption: img.caption, decorative: img.decorative }] }) });
      const pv = await pvRes.json();
      if (!pvRes.ok) { setStatus(`خطا: ${pv.error ?? pvRes.status}`); return; }
      if (!pv.changes?.length) { setStatus('تغییری نیست'); return; }
      const apRes = await fetch('/api/tag/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pv) });
      const ap = await apRes.json();
      if (apRes.ok && ap.applied) { setLastBackupDir(ap.backupDir); setStatus(`ذخیره شد (${ap.backupDir.split('/').pop()})`); }
      else setStatus(`خطا: ${ap.error ?? apRes.status}`);
    } catch { setStatus('خطا در ذخیره‌سازی'); }
  }, []);

  const undo = useCallback(async () => {
    if (!lastBackupDir) { setStatus('چیزی برای بازگردانی نیست'); return; }
    try {
      const res = await fetch('/api/tag/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ backupDir: lastBackupDir }) });
      const d = await res.json();
      setStatus(res.ok ? `بازگردانی شد (${d.restored})` : `خطا: ${d.error ?? ''}`);
      setLastBackupDir(null); await load(page, needsAlt);
    } catch { setStatus('خطا در بازگردانی'); }
  }, [lastBackupDir, load, page, needsAlt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';
      if (e.key === 'ArrowDown' && !typing) { e.preventDefault(); setFocus((f) => Math.min(f + 1, images.length - 1)); }
      else if (e.key === 'ArrowUp' && !typing) { e.preventDefault(); setFocus((f) => Math.max(f - 1, 0)); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (cur) save(cur); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') { e.preventDefault(); if (cur) regenerate(cur); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [images.length, cur, save]);

  return (
    <main className="zh-tag">
      <ModeNav active="images" />
      <div className="zh-tag-score" role="status">
        <span className="zh-tag-score__chip">{needsAlt ? 'بدون الت' : 'همه'}: {toPersianDigits(total)} تصویر</span>
        <label className="zh-tag-score__chip"><input type="checkbox" checked={needsAlt} onChange={(e) => { setNeedsAlt(e.target.checked); setPage(1); }} /> فقط بدون الت</label>
        <span className="zh-tag-score__chip">صفحه {toPersianDigits(page)}/{toPersianDigits(totalPages)}</span>
        <button className="zh-tag__age" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>قبلی</button>
        <button className="zh-tag__age" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>بعدی</button>
        <button className="zh-tag__age" disabled={!lastBackupDir} onClick={undo}>بازگردانی</button>
      </div>
      <ul className="zh-tag__imglist">
        {images.map((img, i) => {
          const border = img.decorative || (img.alt ?? '').trim() ? 'is-set' : (img.inUse ? 'is-empty' : 'is-orphan');
          return (
            <li key={img.id} className={`zh-tag__img ${border}${i === focus ? ' is-focus' : ''}`} onClick={() => setFocus(i)}>
              <img className="zh-tag__thumb" src={img.thumbnailURL || img.url} alt="" loading="lazy" />
              <div className="zh-tag__imgfields">
                <div className="zh-tag__imgmeta">{img.filename}{!img.inUse ? ' · بدون مرجع' : ''}</div>
                <textarea className="zh-tag__alt" rows={2} placeholder="الت…" value={img.alt ?? ''} onChange={(e) => patch(img.id, { alt: e.target.value })} />
                <input className="zh-tag__caption" placeholder="کپشن…" value={img.caption ?? ''} onChange={(e) => patch(img.id, { caption: e.target.value })} />
                <div className="zh-tag__imgactions">
                  <label><input type="checkbox" checked={img.decorative} onChange={(e) => patch(img.id, { decorative: e.target.checked })} /> تزئینی</label>
                  <button className="zh-tag__age" onClick={() => regenerate(img)} disabled={!img.ctx}>تولید الت <kbd>⌘R</kbd></button>
                  <button className="zh-tag__age" onClick={() => save(img)}>ذخیره <kbd>⌘S</kbd></button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="zh-tag__status" role="status">{status}</p>
    </main>
  );
}
