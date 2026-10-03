import { CLASSES, Customer, PACKAGES } from '../types';
import { Bars, DonutChart, statusSlices } from '../components/DonutChart';
import { TodayList } from '../components/TodayList';
import { calc } from '../utils/service';
import { todayISO } from '../utils/date';

const Kpi = ({ label, value, tone = 'text-slate-900' }: { label: string; value: string | number; tone?: string }) => (
  <div className="card"><div className="text-sm text-slate-500">{label}</div><div className={`mt-1 text-3xl font-bold ${tone}`}>{value}</div></div>
);

export function Dashboard({ customers, onViewToday }: { customers: Customer[]; onViewToday: () => void }) {
  const today = todayISO(), inf = customers.map((c) => ({ c, i: calc(c, today) }));
  const n = (st: string) => customers.filter((c) => c.status === st).length;
  const due = inf.filter((x) => x.i.followUpToday).map((x) => x.c);
  const goal = n('GOAL (Service)'), cancel = n('CANCEL (Batal)');
  const conv = goal + cancel === 0 ? 0 : Math.round((goal / (goal + cancel)) * 100);
  const counts = Object.fromEntries(['Menunggu Jadwal', 'Sedang Di-Follow Up', 'GOAL (Service)', 'CANCEL (Batal)', 'Follow Up Ulang'].map((s) => [s, n(s)]));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {due.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between" role="status">
          <p className="font-medium text-amber-900">Anda memiliki {due.length} customer yang perlu di-follow-up hari ini.</p>
          <button className="btn-primary min-h-11" onClick={onViewToday}>Lihat Customer</button>
        </div>)}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total Customer" value={customers.length} />
        <Kpi label="GOAL (Service)" value={goal} tone="text-green-700" />
        <Kpi label="CANCEL (Batal)" value={cancel} tone="text-red-600" />
        <Kpi label="Follow Up" value={n('Menunggu Jadwal') + n('Sedang Di-Follow Up') + n('Follow Up Ulang')} tone="text-amber-600" />
        <Kpi label="Follow Up Hari Ini" value={due.length} tone="text-teal-700" />
        <Kpi label="Overdue" value={inf.filter((x) => x.i.overdueDays > 0).length} tone="text-red-600" />
        <Kpi label="Upcoming 7 Hari" value={inf.filter((x) => x.i.upcoming7).length} />
        <Kpi label="Conversion Rate" value={`${conv}%`} tone="text-teal-700" />
        <Kpi label="Service Completed" value={inf.reduce((a, x) => a + x.i.completed, 0)} />
        <Kpi label="Service Remaining" value={inf.reduce((a, x) => a + x.i.remaining, 0)} />
        <Kpi label="Premium Customers" value={customers.filter((c) => c.servicePackage === 'Premium').length} />
        <Kpi label="Double Customers" value={customers.filter((c) => c.servicePackage === 'Double').length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card"><h2 className="mb-3 font-semibold">Status Customer</h2><DonutChart slices={statusSlices(counts)} /></section>
        <section className="card"><h2 className="mb-1 font-semibold">Follow Up Hari Ini</h2><TodayList list={due} /></section>
        <section className="card"><h2 className="mb-3 font-semibold">Klasifikasi Customer</h2><Bars items={CLASSES.map((k) => [k, customers.filter((c) => c.classification === k).length])} /></section>
        <section className="card"><h2 className="mb-3 font-semibold">Service Package</h2><Bars items={PACKAGES.map((k) => [k, customers.filter((c) => c.servicePackage === k).length])} /></section>
      </div>
    </div>
  );
}
