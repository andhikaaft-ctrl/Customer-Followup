import { Customer } from '../types';
import { fmt, todayISO } from '../utils/date';
import { nextDate, overdueDays, waLink } from '../utils/customer';
import { OverdueBadge, StatusBadge } from './StatusBadge';

export function TodayList({ list }: { list: Customer[] }) {
  const today = todayISO();
  if (!list.length) return <p className="text-sm text-slate-500">Tidak ada customer yang perlu dihubungi hari ini.</p>;
  return (
    <ul className="divide-y divide-slate-100">
      {list.map((c) => (
        <li key={c.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><b>{c.name}</b><StatusBadge status={c.status} /><OverdueBadge days={overdueDays(c, today)} /></div>
            <div className="text-sm text-slate-500">{c.whatsapp} · Jadwal {fmt(nextDate(c))}</div>
            {c.notes && <div className="truncate text-sm text-slate-600">{c.notes}</div>}
          </div>
          <a className="btn-wa shrink-0" href={waLink(c.whatsapp)} target="_blank" rel="noreferrer">WhatsApp</a>
        </li>))}
    </ul>
  );
}
