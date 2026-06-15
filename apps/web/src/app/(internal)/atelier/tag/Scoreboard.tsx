// apps/web/src/app/(internal)/atelier/tag/Scoreboard.tsx
'use client';
import { toPersianDigits } from '@zhic/locale';

export function Scoreboard({ complete, total }: { complete: number; total: number }) {
  return (
    <div className="zh-tag-score" role="status">
      <span className="zh-tag-score__chip">
        تکمیل اشغال: {toPersianDigits(complete)}/{toPersianDigits(total)} طرح
      </span>
    </div>
  );
}
