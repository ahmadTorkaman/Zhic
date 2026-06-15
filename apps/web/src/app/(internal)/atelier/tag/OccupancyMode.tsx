// apps/web/src/app/(internal)/atelier/tag/OccupancyMode.tsx
'use client';
import { useCallback, useEffect, useState } from 'react';
import { OCCUPANCIES, OCCUPANCY_FA, type Occupancy } from '@/lib/tag/types';
import { ModeNav } from './ModeNav';
import { Scoreboard } from './Scoreboard';

type Candidate = { id: number; url: string; alt: string | null; filename: string };
type DesignState = {
  designId: number; slug: string; title: string;
  occupancies: Occupancy[];
  posters: { occupancy: Occupancy; imageId: number }[];
  candidates: Candidate[];
};

export function OccupancyMode({ userEmail }: { userEmail: string; initialMode?: string }) {
  const [designs, setDesigns] = useState<DesignState[]>([]);
  const [score, setScore] = useState({ complete: 0, total: 0 });
  const [focus, setFocus] = useState(0);
  const [pickerOcc, setPickerOcc] = useState<Occupancy | null>(null);
  const [status, setStatus] = useState('');
  const [lastBackupDir, setLastBackupDir] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/tag/state', { cache: 'no-store' });
    const data = await res.json();
    setDesigns(data.designs);
    setScore({ complete: data.scoreboard.designsComplete, total: data.scoreboard.designsTotal });
  }, []);
  useEffect(() => { load(); }, [load]);

  const cur = designs[focus];

  const toggleOcc = (o: Occupancy) => setDesigns((ds) => ds.map((d, i) => i !== focus ? d : {
    ...d, occupancies: d.occupancies.includes(o) ? d.occupancies.filter((x) => x !== o) : [...d.occupancies, o],
  }));
  const setPoster = (o: Occupancy, imageId: number) => setDesigns((ds) => ds.map((d, i) => i !== focus ? d : {
    ...d, posters: [...d.posters.filter((p) => p.occupancy !== o), { occupancy: o, imageId }],
  }));

  const save = useCallback(async () => {
    if (!cur) return;
    setStatus('در حال پیش‌نمایش…');
    try {
      const pvRes = await fetch('/api/tag/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ edits: [{ designId: cur.designId, occupancies: cur.occupancies, posters: cur.posters.map((p) => ({ occupancy: p.occupancy, imageId: p.imageId })) }] }) });
      const pv = await pvRes.json();
      if (!pvRes.ok) { setStatus(`خطا: ${pv.error ?? pvRes.status}`); return; }
      if (!pv.changes?.length) { setStatus('تغییری نیست'); return; }
      const apRes = await fetch('/api/tag/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pv) });
      const ap = await apRes.json();
      if (apRes.ok && ap.applied) { setLastBackupDir(ap.backupDir); setStatus(`ذخیره شد (نسخه‌ی پشتیبان: ${ap.backupDir.split('/').pop()})`); }
      else { setStatus(`خطا: ${ap.error ?? apRes.status}`); }
      await load();
    } catch {
      setStatus('خطا در ذخیره‌سازی');
    }
  }, [cur, load]);

  const undo = useCallback(async () => {
    if (!lastBackupDir) { setStatus('چیزی برای بازگردانی نیست'); return; }
    setStatus('در حال بازگردانی…');
    try {
      const res = await fetch('/api/tag/undo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ backupDir: lastBackupDir }) });
      const data = await res.json();
      setStatus(res.ok ? `بازگردانی شد (${data.restored} طرح)` : `خطا: ${data.error ?? ''}`);
      setLastBackupDir(null);
      await load();
    } catch {
      setStatus('خطا در بازگردانی');
    }
  }, [lastBackupDir, load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pickerOcc) { if (e.key === 'Escape') setPickerOcc(null); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocus((f) => Math.min(f + 1, designs.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocus((f) => Math.max(f - 1, 0)); }
      else if (['1', '2', '3', '4'].includes(e.key)) { const o = OCCUPANCIES[Number(e.key) - 1]; if (!o) return; if (e.shiftKey) setPickerOcc(o); else toggleOcc(o); }
      else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      else if (e.key === 'Z' || e.key === 'z') { undo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [designs.length, pickerOcc, save, undo]); // toggleOcc/save close over focus via state setters

  if (!cur) return <main className="zh-tag"><ModeNav active="occupancy" /><p>در حال بارگذاری…</p></main>;

  return (
    <main className="zh-tag" data-user={userEmail}>
      <ModeNav active="occupancy" />
      <Scoreboard complete={score.complete} total={score.total} />
      <div className="zh-tag__cols">
        <ul className="zh-tag__list">
          {designs.map((d, i) => {
            const done = d.occupancies.length > 0 && d.occupancies.every((o) => d.posters.some((p) => p.occupancy === o));
            return (
              <li key={d.designId} aria-current={i === focus} className={`zh-tag__row${i === focus ? ' is-focus' : ''}`} onClick={() => setFocus(i)}>
                <span>{d.title}</span>
                <span className="zh-tag__dots">{OCCUPANCIES.map((o) => (
                  <i key={o} className={`zh-tag__dot${d.occupancies.includes(o) ? (d.posters.some((p) => p.occupancy === o) ? ' is-set' : ' is-needs-poster') : ''}`} title={OCCUPANCY_FA[o]} />
                ))}{done ? ' ✓' : ''}</span>
              </li>
            );
          })}
        </ul>

        <section className="zh-tag__center">
          <h2>{cur.title}</h2>
          <div className="zh-tag__ages">
            {OCCUPANCIES.map((o, idx) => (
              <button key={o} className={`zh-tag__age${cur.occupancies.includes(o) ? ' is-on' : ''}`} onClick={() => toggleOcc(o)}>
                {OCCUPANCY_FA[o]} <kbd>{idx + 1}</kbd>
              </button>
            ))}
          </div>
          <div className="zh-tag__posters">
            {cur.occupancies.map((o) => {
              const p = cur.posters.find((x) => x.occupancy === o);
              const img = p ? cur.candidates.find((c) => c.id === p.imageId) : undefined;
              return (
                <div key={o} className="zh-tag__poster" onClick={() => setPickerOcc(o)}>
                  <span>{OCCUPANCY_FA[o]}</span>
                  {img ? <img src={img.url} alt={img.alt ?? ''} /> : <em>انتخاب پوستر…</em>}
                </div>
              );
            })}
          </div>
          <p className="zh-tag__status" role="status">{status}</p>
          <button className="zh-tag__age" onClick={undo} disabled={!lastBackupDir}>بازگردانی آخرین تغییر <kbd>Z</kbd></button>
        </section>

        {pickerOcc ? (
          <aside className="zh-tag__picker">
            <header>پوستر «{OCCUPANCY_FA[pickerOcc]}» — Esc برای بستن</header>
            <div className="zh-tag__grid">
              {cur.candidates.map((c) => (
                <button key={c.id} onClick={() => { setPoster(pickerOcc, c.id); setPickerOcc(null); }}>
                  <img src={c.url} alt={c.alt ?? c.filename} />
                </button>
              ))}
            </div>
          </aside>
        ) : null}
      </div>
    </main>
  );
}
