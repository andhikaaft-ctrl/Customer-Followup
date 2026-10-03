import { Status } from '../types';

export const STATUS_COLOR: Record<Status, string> = {
  'Menunggu Jadwal': '#64748b',
  'Sedang Di-Follow Up': '#d97706',
  'GOAL (Service)': '#16a34a',
  'CANCEL (Batal)': '#dc2626',
  'Follow Up Ulang': '#7c3aed',
};
const CLS: Record<Status, string> = {
  'Menunggu Jadwal': 'bg-slate-100 text-slate-700',
  'Sedang Di-Follow Up': 'bg-amber-100 text-amber-800',
  'GOAL (Service)': 'bg-green-100 text-green-800',
  'CANCEL (Batal)': 'bg-red-100 text-red-800',
  'Follow Up Ulang': 'bg-violet-100 text-violet-800',
};
export const StatusBadge = ({ status }: { status: Status }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${CLS[status]}`}>{status}</span>
);
export const OverdueBadge = ({ days }: { days: number }) =>
  days > 0 ? <span className="inline-block whitespace-nowrap rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-semibold text-white">OVERDUE {days} hari</span> : null;

import { ServiceInfo, ServiceRow } from '../utils/service';
import { fmt } from '../utils/date';

export function ServiceBadge({ i }: { i: ServiceInfo }) {
  const p = 'inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold';
  if (i.state === 'Entitlement Habis') return <span className={`${p} bg-slate-800 text-white`}>ENTITLEMENT HABIS</span>;
  if (i.state === 'Overdue') return <span className={`${p} bg-red-600 text-white`}>OVERDUE {i.overdueDays} hari</span>;
  if (i.state === 'Due Today') return <span className={`${p} bg-amber-500 text-white`}>DUE TODAY</span>;
  if (i.state === 'Upcoming') return <span className={`${p} bg-sky-100 text-sky-800`}>Upcoming</span>;
  return null;
}
export function ServiceHistory({ rows }: { rows: ServiceRow[] }) {
  const cls = { Completed: 'text-green-700', Overdue: 'text-red-600', Due: 'text-amber-600', Upcoming: 'text-slate-500' };
  return (
    <ul className="space-y-1 text-sm">
      {rows.map((r) => (
        <li key={r.serviceNumber} className="flex justify-between gap-2">
          <span>Service {r.serviceNumber} · {fmt(r.scheduledDate)}</span>
          <span className={`font-medium ${cls[r.status]}`}>{r.status}{r.completedDate && ` (${fmt(r.completedDate)})`}</span>
        </li>))}
    </ul>
  );
}
