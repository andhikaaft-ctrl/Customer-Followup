import { Customer } from '../types';
import { DonutChart } from '../components/DonutChart';
import { TodayList } from '../components/TodayList';
import { conversionRate, isDueToday, isUpcoming, overdueDays } from '../utils/customer';
import { todayISO } from '../utils/date';

const Kpi = ({ label, value, tone = 'text-slate-900' }: { label: string; value: string | number; tone?: string }) => (
  <div className="card"><div className="text-sm text-slate-500">{label}</div><div className={`mt-1 text-3xl font-bold ${tone}`}>{value}</div></div>
);

export function Dashboard({ customers, onViewToday }: { customers: Customer[]; onViewToday: () => void }) {
  const today = todayISO();
  const n = (st: string) => customers.filter((c) => c.status === st).length;
  const due = customers.filter((c) => isDueToday(c, today));
  const overdue = customers.filter((c) => overdueDays(c, today) > 0).length;
  const upcoming = customers.filter((c) => isUpcoming(c, today)).length;
  const followUp = n('Menunggu Jadwal') + n('Sedang Di-Follow Up') + n('Follow Up Ulang');
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {due.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between" role="status">
          <p className="font-medium text-amber-900">Anda memiliki {due.length} customer yang perlu di-follow-up hari ini.</p>
          <button className="btn-primary" onClick={onViewToday}>Lihat Customer</button>
        </div>)}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total Customer" value={customers.length} />
        <Kpi label="GOAL (Service)" value={n('GOAL (Service)')} tone="text-green-700" />
        <Kpi label="CANCEL (Batal)" value={n('CANCEL (Batal)')} tone="text-red-600" />
        <Kpi label="Follow Up" value={followUp} tone="text-amber-600" />
        <Kpi label="Follow Up Hari Ini" value={due.length} tone="text-teal-700" />
        <Kpi label="Overdue" value={overdue} tone="text-red-600" />
        <Kpi label="Upcoming (7 hari)" value={upcoming} />
        <Kpi label="Conversion Rate" value={`${conversionRate(customers)}%`} tone="text-teal-700" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card"><h2 className="mb-3 font-semibold">Status Customer</h2><DonutChart customers={customers} /></section>
        <section className="card"><h2 className="mb-1 font-semibold">Follow Up Hari Ini</h2><TodayList list={due} /></section>
      </div>
    </div>
  );
}
