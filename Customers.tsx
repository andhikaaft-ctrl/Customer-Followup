import { useMemo, useState } from 'react';
import { Customer, CustomerInput, STATUSES } from '../types';
import { CustomerForm } from '../components/CustomerForm';
import { ConfirmDialog } from '../components/Modal';
import { OverdueBadge, StatusBadge } from '../components/StatusBadge';
import { fmt, todayISO } from '../utils/date';
import { isDone, isDueToday, nextDate, normalizeWA, overdueDays, serviceDate, waLink } from '../utils/customer';

type SortKey = 'next' | 'name' | 'purchaseDate' | 'service' | 'reschedule';
interface Props {
  customers: Customer[]; todayOnly: boolean; setTodayOnly: (v: boolean) => void;
  onAdd: (d: CustomerInput) => void; onUpdate: (id: string, d: CustomerInput) => void; onRemove: (id: string) => void;
}

export function Customers({ customers, todayOnly, setTodayOnly, onAdd, onUpdate, onRemove }: Props) {
  const today = todayISO();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('Semua');
  const [sort, setSort] = useState<SortKey>('next');
  const [desc, setDesc] = useState(false);
  const [form, setForm] = useState<Customer | 'new' | null>(null);
  const [del, setDel] = useState<Customer | null>(null);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase(), qd = q.replace(/\D/g, '');
    const key = (c: Customer) => ({
      next: nextDate(c), name: c.name.toLowerCase(), purchaseDate: c.purchaseDate, service: serviceDate(c),
      reschedule: c.rescheduleDate || '9999-99-99',
    })[sort];
    return customers
      .filter((c) => (status === 'Semua' || c.status === status) && (!todayOnly || isDueToday(c, today)))
      .filter((c) => !qq || c.name.toLowerCase().includes(qq) || (qd.length > 0 && c.whatsapp.includes(normalizeWA(qd).length ? qd : '#')) || (qd.length > 0 && c.whatsapp.includes(normalizeWA(qd))))
      .sort((a, b) => {
        if (sort === 'next' && isDone(a) !== isDone(b)) return isDone(a) ? 1 : -1; // yang selesai di bawah
        const r = key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0;
        return desc ? -r : r;
      });
  }, [customers, q, status, todayOnly, sort, desc, today]);

  if (!customers.length) return (
    <div className="card mx-auto mt-10 max-w-md py-10 text-center">
      <p className="mb-4 text-slate-600">Belum ada data customer.</p>
      <button className="btn-primary" onClick={() => setForm('new')}>+ Tambah Customer</button>
      {form && <CustomerForm onSave={(d) => { onAdd(d); setForm(null); }} onClose={() => setForm(null)} />}
    </div>);

  const Actions = ({ c }: { c: Customer }) => (
    <div className="flex flex-wrap gap-1.5">
      <a className="btn-wa !px-2.5 !py-1.5" href={waLink(c.whatsapp)} target="_blank" rel="noreferrer">WhatsApp</a>
      <button className="btn-ghost !px-2.5 !py-1.5" onClick={() => setForm(c)}>Edit</button>
      <button className="btn-ghost !px-2.5 !py-1.5 !text-red-600" onClick={() => setDel(c)}>Delete</button>
    </div>);
  const Status = ({ c }: { c: Customer }) => <div className="flex flex-wrap gap-1"><StatusBadge status={c.status} /><OverdueBadge days={overdueDays(c, today)} /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Data Customer</h1>
        <button className="btn-primary" onClick={() => setForm('new')}>+ Tambah Customer</button>
      </div>
      <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input className="input" type="search" placeholder="Cari nama / nomor WhatsApp" aria-label="Cari customer" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input" aria-label="Filter status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option>Semua</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <div className="flex gap-2">
          <select className="input" aria-label="Urutkan" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="next">Follow-up terdekat</option><option value="name">Nama</option><option value="purchaseDate">Tanggal Pembelian</option>
            <option value="service">Jadwal Service</option><option value="reschedule">Follow Up Ulang</option></select>
          <button className="btn-ghost" onClick={() => setDesc(!desc)} aria-label="Balik urutan">{desc ? '↓' : '↑'}</button>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-teal-700" checked={todayOnly} onChange={(e) => setTodayOnly(e.target.checked)} />Jadwal Hari Ini</label>
      </div>

      {rows.length === 0 ? <p className="card text-center text-sm text-slate-500">Tidak ada customer yang cocok dengan filter.</p> : (<>
        <div className="card hidden overflow-x-auto !p-0 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600"><tr>
              {['Nama Customer', 'WhatsApp', 'Tanggal Pembelian', 'Jadwal Service', 'Status', 'Follow Up Ulang', 'Action'].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="px-3 py-3 font-medium">{c.name}{c.notes && <div className="max-w-[14rem] truncate text-xs font-normal text-slate-500">{c.notes}</div>}</td>
                  <td className="px-3 py-3">{c.whatsapp}</td><td className="px-3 py-3">{fmt(c.purchaseDate)}</td><td className="px-3 py-3">{fmt(serviceDate(c))}</td>
                  <td className="px-3 py-3"><Status c={c} /></td><td className="px-3 py-3">{fmt(c.rescheduleDate)}</td><td className="px-3 py-3"><Actions c={c} /></td>
                </tr>))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-3 md:hidden">
          {rows.map((c) => (
            <li key={c.id} className="card space-y-2">
              <div className="flex items-start justify-between gap-2"><b>{c.name}</b><Status c={c} /></div>
              <div className="text-sm text-slate-600">{c.whatsapp}</div>
              <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                <span>Pembelian: {fmt(c.purchaseDate)}</span><span>Service: {fmt(serviceDate(c))}</span>
                {c.rescheduleDate && <span>Follow up: {fmt(c.rescheduleDate)}</span>}</div>
              {c.notes && <p className="text-sm text-slate-600">{c.notes}</p>}
              <Actions c={c} />
            </li>))}
        </ul></>)}

      {form && <CustomerForm initial={form === 'new' ? undefined : form}
        onSave={(d) => { form === 'new' ? onAdd(d) : onUpdate(form.id, d); setForm(null); }} onClose={() => setForm(null)} />}
      {del && <ConfirmDialog message="Apakah Anda yakin ingin menghapus customer ini?" confirmLabel="Hapus"
        onConfirm={() => { onRemove(del.id); setDel(null); }} onCancel={() => setDel(null)} />}
    </div>
  );
}
