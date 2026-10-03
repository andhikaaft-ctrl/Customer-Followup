import { useMemo, useState } from 'react';
import { CLASSES, Customer, CustomerInput, PACKAGES, STATUSES, VEHICLES } from '../types';
import { CustomerForm } from '../components/CustomerForm';
import { ConfirmDialog } from '../components/Modal';
import { ServiceBadge, ServiceHistory, StatusBadge } from '../components/StatusBadge';
import { fmt, todayISO } from '../utils/date';
import { calc, serviceRows } from '../utils/service';
import { waLink } from '../utils/whatsapp';

type SortKey = 'next' | 'name' | 'entryDate' | 'coatingDate' | 'progress';
interface Props {
  customers: Customer[]; todayOnly: boolean; setTodayOnly: (v: boolean) => void;
  onAdd: (d: CustomerInput) => void; onUpdate: (id: string, d: CustomerInput) => void; onRemove: (id: string) => void; onComplete: (id: string) => void;
}
const SVC = ['Upcoming', 'Due Today', 'Overdue', 'Completed', 'Entitlement Habis'];

function Sel({ label, v, set, list }: { label: string; v: string; set: (v: string) => void; list: readonly string[] }) {
  return (
    <select className="input min-h-11" aria-label={label} value={v} onChange={(e) => set(e.target.value)}>
      <option value="Semua">{label}: Semua</option>{list.map((s) => <option key={s}>{s}</option>)}
    </select>);
}

export function Customers({ customers, todayOnly, setTodayOnly, onAdd, onUpdate, onRemove, onComplete }: Props) {
  const today = todayISO();
  const [q, setQ] = useState('');
  const [fl, setFl] = useState({ status: 'Semua', vehicle: 'Semua', cls: 'Semua', product: 'Semua', pkg: 'Semua', svc: 'Semua' });
  const [sort, setSort] = useState<SortKey>('next');
  const [desc, setDesc] = useState(false);
  const [form, setForm] = useState<Customer | 'new' | null>(null);
  const [del, setDel] = useState<Customer | null>(null);
  const f = (k: keyof typeof fl) => (v: string) => setFl((p) => ({ ...p, [k]: v }));
  const products = useMemo(() => [...new Set(customers.map((c) => c.product))].sort(), [customers]);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase(), qd = q.replace(/\D/g, '');
    const qw = qd.startsWith('0') ? '62' + qd.slice(1) : qd;
    const key = (x: { c: Customer; i: ReturnType<typeof calc> }) => ({
      next: x.i.next ?? '9999', name: x.c.name.toLowerCase(), entryDate: x.c.entryDate, coatingDate: x.c.coatingDate, progress: x.i.completed / x.i.total,
    })[sort];
    return customers.map((c) => ({ c, i: calc(c, today) })).filter(({ c, i }) =>
      (fl.status === 'Semua' || c.status === fl.status) && (fl.vehicle === 'Semua' || c.vehicleType === fl.vehicle) &&
      (fl.cls === 'Semua' || c.classification === fl.cls) && (fl.product === 'Semua' || c.product === fl.product) &&
      (fl.pkg === 'Semua' || c.servicePackage === fl.pkg) && (!todayOnly || i.followUpToday) &&
      (fl.svc === 'Semua' || (fl.svc === 'Completed' ? i.completed > 0 : i.state === fl.svc)) &&
      (!qq || [c.name, c.whatsapp, c.vehicleType, c.product, c.classification, c.servicePackage].join(' ').toLowerCase().includes(qq) || (qw.length > 2 && c.whatsapp.includes(qw))))
      .sort((a, b) => {
        if (sort === 'next' && a.i.actionable !== b.i.actionable) return a.i.actionable ? -1 : 1;
        const r = key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;
        return desc ? -r : r;
      });
  }, [customers, q, fl, todayOnly, sort, desc, today]);

  const formEl = form && <CustomerForm initial={form === 'new' ? undefined : form} products={products}
    onSave={(d) => { form === 'new' ? onAdd(d) : onUpdate(form.id, d); setForm(null); }} onClose={() => setForm(null)} />;
  if (!customers.length) return (
    <div className="card mx-auto mt-10 max-w-md py-10 text-center">
      <p className="mb-4 text-slate-600">Belum ada data customer.</p>
      <button className="btn-primary min-h-11" onClick={() => setForm('new')}>+ Tambah Customer</button>{formEl}
    </div>);

  type Row = (typeof rows)[number];
  const Actions = ({ c, i }: Row) => (
    <div className="flex flex-wrap gap-1.5">
      {i.actionable && <button className="btn-primary !px-2.5 min-h-10" onClick={() => onComplete(c.id)} title="Mark Service as Completed">Service Selesai</button>}
      <a className="btn-wa !px-2.5 min-h-10" href={waLink(c.whatsapp)} target="_blank" rel="noreferrer">WhatsApp</a>
      <button className="btn-ghost !px-2.5 min-h-10" onClick={() => setForm(c)}>Edit</button>
      <button className="btn-ghost !px-2.5 min-h-10 !text-red-600" onClick={() => setDel(c)}>Delete</button>
    </div>);
  const Next = ({ i }: Row) => <span>{i.next ? `S${i.active} · ${fmt(i.next)}` : '-'}</span>;
  const Stat = (r: Row) => <div className="flex flex-wrap gap-1"><StatusBadge status={r.c.status} /><ServiceBadge i={r.i} /></div>;
  const th = ['Tgl Masuk', 'Kendaraan', 'Nama Customer', 'No. Tlp', 'Product', 'Klasifikasi', 'Tgl Aplikasi Coating', 'Layanan', 'Progress', 'Service Berikutnya', 'Status', 'Action'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Data Customer</h1>
        <button className="btn-primary min-h-11" onClick={() => setForm('new')}>+ Tambah Customer</button>
      </div>
      <div className="card space-y-3">
        <input className="input min-h-11" type="search" placeholder="Cari nama, no. tlp, kendaraan, product, klasifikasi, layanan" aria-label="Cari customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Sel label="Status" v={fl.status} set={f('status')} list={STATUSES} /><Sel label="Kendaraan" v={fl.vehicle} set={f('vehicle')} list={VEHICLES} />
          <Sel label="Klasifikasi" v={fl.cls} set={f('cls')} list={CLASSES} /><Sel label="Product" v={fl.product} set={f('product')} list={products} />
          <Sel label="Layanan" v={fl.pkg} set={f('pkg')} list={PACKAGES} /><Sel label="Service" v={fl.svc} set={f('svc')} list={SVC} />
          <div className="flex gap-2">
            <select className="input min-h-11" aria-label="Urutkan" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              <option value="next">Service terdekat</option><option value="name">Nama</option><option value="entryDate">Tgl Masuk</option>
              <option value="coatingDate">Tgl Aplikasi Coating</option><option value="progress">Service Progress</option></select>
            <button className="btn-ghost min-h-11" onClick={() => setDesc(!desc)} aria-label="Balik urutan">{desc ? '↓' : '↑'}</button>
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-5 w-5 accent-teal-700" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} />Follow Up Hari Ini</label>
        </div>
      </div>

      {rows.length === 0 ? <p className="card text-center text-sm text-slate-500">Tidak ada customer yang cocok dengan filter.</p> : (<>
        <div className="card hidden overflow-x-auto !p-0 lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>{th.map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.c.id} className="align-top">
                  <td className="px-3 py-3">{fmt(r.c.entryDate)}</td><td className="px-3 py-3">{r.c.vehicleType}</td><td className="px-3 py-3 font-medium">{r.c.name}</td>
                  <td className="px-3 py-3">{r.c.whatsapp}</td><td className="px-3 py-3">{r.c.product}</td><td className="px-3 py-3">{r.c.classification}</td>
                  <td className="px-3 py-3">{fmt(r.c.coatingDate)}</td><td className="px-3 py-3">{r.c.servicePackage}</td>
                  <td className="whitespace-nowrap px-3 py-3">{r.i.completed} / {r.i.total}</td><td className="whitespace-nowrap px-3 py-3"><Next {...r} /></td>
                  <td className="px-3 py-3"><Stat {...r} /></td><td className="px-3 py-3"><Actions {...r} /></td>
                </tr>))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-3 lg:hidden">
          {rows.map((r) => (
            <li key={r.c.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2"><b>{r.c.name}</b><Stat {...r} /></div>
              <div className="text-sm text-slate-600">{r.c.whatsapp} · {r.c.vehicleType}</div>
              <div className="text-sm text-slate-600">{r.c.product} · {r.c.classification} · {r.c.servicePackage}</div>
              <div className="flex justify-between text-sm"><span>Progress <b>{r.i.completed} / {r.i.total}</b></span><span>Berikutnya <b><Next {...r} /></b></span></div>
              <details className="text-sm"><summary className="min-h-10 cursor-pointer py-2 text-teal-800">Detail</summary>
                <div className="space-y-2 pb-2 text-slate-600">
                  <div>Masuk {fmt(r.c.entryDate)} · Beli {fmt(r.c.purchaseDate)} · Coating {fmt(r.c.coatingDate)}</div>
                  {r.c.rescheduleDate && <div>Follow up ulang: {fmt(r.c.rescheduleDate)}</div>}
                  {r.c.cancelReason && <div>Alasan cancel: {r.c.cancelReason}</div>}
                  {r.c.notes && <div>Catatan: {r.c.notes}</div>}
                  <ServiceHistory rows={serviceRows(r.c, today)} /></div></details>
              <Actions {...r} />
            </li>))}
        </ul></>)}

      {formEl}
      {del && <ConfirmDialog message="Apakah Anda yakin ingin menghapus customer ini?" confirmLabel="Hapus"
        onConfirm={() => { onRemove(del.id); setDel(null); }} onCancel={() => setDel(null)} />}
    </div>
  );
}
