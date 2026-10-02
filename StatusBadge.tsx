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
