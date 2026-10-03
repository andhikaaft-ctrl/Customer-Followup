import { STATUSES } from '../types';
import { STATUS_COLOR } from './StatusBadge';

export interface Slice { label: string; value: number; color: string }
export const statusSlices = (counts: Record<string, number>): Slice[] => STATUSES.map((s) => ({ label: s, value: counts[s] ?? 0, color: STATUS_COLOR[s] }));

export function DonutChart({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((a, s) => a + s.value, 0), R = 40, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 100 100" className="h-40 w-40 shrink-0 -rotate-90" role="img" aria-label="Chart status customer">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        {total > 0 && slices.filter((x) => x.value > 0).map((s) => {
          const len = (s.value / total) * C;
          const el = <circle key={s.label} cx="50" cy="50" r={R} fill="none" stroke={s.color} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />;
          acc += len; return el;
        })}
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: s.color }} />{s.label}</span><b>{s.value}</b>
          </li>))}
      </ul>
    </div>
  );
}
export function Bars({ items }: { items: [string, number][] }) {
  const max = Math.max(1, ...items.map((i) => i[1]));
  return (
    <ul className="space-y-2 text-sm">
      {items.map(([l, n]) => (
        <li key={l}><div className="mb-0.5 flex justify-between"><span>{l}</span><b>{n}</b></div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-teal-600" style={{ width: `${(n / max) * 100}%` }} /></div></li>))}
    </ul>
  );
}
