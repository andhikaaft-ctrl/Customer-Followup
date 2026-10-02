import { Customer, STATUSES } from '../types';
import { STATUS_COLOR } from './StatusBadge';

export function DonutChart({ customers }: { customers: Customer[] }) {
  const counts = STATUSES.map((s) => ({ s, n: customers.filter((c) => c.status === s).length }));
  const total = customers.length, R = 40, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <svg viewBox="0 0 100 100" className="h-40 w-40 shrink-0 -rotate-90" role="img" aria-label="Chart status customer">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="14" />
        {total > 0 && counts.filter((x) => x.n > 0).map(({ s, n }) => {
          const len = (n / total) * C, el = (
            <circle key={s} cx="50" cy="50" r={R} fill="none" stroke={STATUS_COLOR[s]} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} />);
          acc += len; return el;
        })}
      </svg>
      <ul className="w-full space-y-1.5 text-sm">
        {counts.map(({ s, n }) => (
          <li key={s} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLOR[s] }} />{s}</span>
            <b>{n}</b>
          </li>))}
      </ul>
    </div>
  );
}
