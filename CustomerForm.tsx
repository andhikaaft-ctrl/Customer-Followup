import { FormEvent, ReactNode, useState } from 'react';
import { CLASSES, Customer, CustomerInput, PACKAGES, STATUSES, Status, VEHICLES } from '../types';
import { Modal } from './Modal';
import { ServiceHistory } from './StatusBadge';
import { fmt, isValidISO, todayISO } from '../utils/date';
import { calc, serviceRows } from '../utils/service';
import { isValidWA, normalizeWA } from '../utils/whatsapp';

const blank = (): CustomerInput => ({ entryDate: todayISO(), vehicleType: 'Motor', name: '', whatsapp: '', product: '', classification: 'B2C', purchaseDate: '', coatingDate: '', servicePackage: 'Premium', status: 'Menunggu Jadwal', rescheduleDate: '', cancelReason: '', notes: '' });

export function CustomerForm({ initial, products, onSave, onClose }: { initial?: Customer; products: string[]; onSave: (d: CustomerInput) => void; onClose: () => void }) {
  const [f, setF] = useState<CustomerInput>(initial ? { ...initial } : blank());
  const [err, setErr] = useState<Record<string, string>>({});
  const set = <K extends keyof CustomerInput>(k: K, v: CustomerInput[K]) => setF((p) => ({ ...p, [k]: v }));
  const preview: Customer = { ...(f as CustomerInput), history: initial?.history ?? [], id: '', createdAt: '', updatedAt: '' };
  const info = isValidISO(f.coatingDate) ? calc(preview) : null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    const date = (k: 'entryDate' | 'purchaseDate' | 'coatingDate', l: string) => { if (!f[k]) x[k] = `${l} wajib diisi.`; else if (!isValidISO(f[k])) x[k] = 'Tanggal tidak valid.'; };
    date('entryDate', 'Tgl Masuk'); date('purchaseDate', 'Tanggal Pembelian'); date('coatingDate', 'Tanggal Aplikasi Coating');
    if (!f.name.trim()) x.name = 'Nama wajib diisi.';
    if (!f.whatsapp.trim()) x.whatsapp = 'No. Tlp wajib diisi.'; else if (!isValidWA(f.whatsapp)) x.whatsapp = 'Nomor tidak valid. Contoh: 08123456789';
    if (!f.product.trim()) x.product = 'Jenis Product wajib diisi.';
    if (f.status === 'Follow Up Ulang' && f.rescheduleDate && !isValidISO(f.rescheduleDate)) x.rescheduleDate = 'Tanggal tidak valid.';
    setErr(x);
    if (Object.keys(x).length) return;
    onSave({ ...f, name: f.name.trim(), product: f.product.trim(), whatsapp: normalizeWA(f.whatsapp),
      rescheduleDate: f.status === 'Follow Up Ulang' ? f.rescheduleDate : '', cancelReason: f.status === 'CANCEL (Batal)' ? f.cancelReason : '' });
  };
  const Field = ({ id, label, k, children }: { id: string; label: string; k?: string; children: ReactNode }) => (
    <div><label className="label" htmlFor={id}>{label}</label>{children}{k && err[k] && <p className="mt-1 text-xs text-red-600" role="alert">{err[k]}</p>}</div>);
  const ro = 'input !bg-slate-100 text-slate-600';
  const Select = ({ id, v, list, on }: { id: string; v: string; list: readonly string[]; on: (v: string) => void }) => (
    <select id={id} className="input" value={v} onChange={(e) => on(e.target.value)}>{list.map((s) => <option key={s}>{s}</option>)}</select>);

  return (
    <Modal title={initial ? 'Edit Customer' : 'Tambah Customer'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field id="en" label="Tgl Masuk" k="entryDate"><input id="en" type="date" className="input" value={f.entryDate} onChange={(e) => set('entryDate', e.target.value)} /></Field>
        <Field id="vt" label="Jenis Kendaraan"><Select id="vt" v={f.vehicleType} list={VEHICLES} on={(v) => set('vehicleType', v as CustomerInput['vehicleType'])} /></Field>
        <Field id="name" label="Nama Customer" k="name"><input id="name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field id="wa" label="No. Tlp" k="whatsapp"><input id="wa" className="input" inputMode="tel" placeholder="08123456789" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /></Field>
        <Field id="pr" label="Jenis Product" k="product">
          <input id="pr" className="input" list="products" value={f.product} onChange={(e) => set('product', e.target.value)} />
          <datalist id="products">{products.map((p) => <option key={p} value={p} />)}</datalist></Field>
        <Field id="cl" label="Klasifikasi"><Select id="cl" v={f.classification} list={CLASSES} on={(v) => set('classification', v as CustomerInput['classification'])} /></Field>
        <Field id="pd" label="Tanggal Pembelian" k="purchaseDate"><input id="pd" type="date" className="input" value={f.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} /></Field>
        <Field id="cd" label="Tanggal Aplikasi Coating" k="coatingDate"><input id="cd" type="date" className="input" value={f.coatingDate} onChange={(e) => set('coatingDate', e.target.value)} /></Field>
        <Field id="sp" label="Jenis Layanan"><Select id="sp" v={f.servicePackage} list={PACKAGES} on={(v) => set('servicePackage', v as CustomerInput['servicePackage'])} /></Field>
        <Field id="ts" label="Total Service"><input id="ts" readOnly className={ro} value={info ? `${info.total}x (selesai ${info.completed}, sisa ${info.remaining})` : f.servicePackage === 'Premium' ? '6x' : '4x'} /></Field>
        <Field id="ns" label="Service Berikutnya"><input id="ns" readOnly className={ro} value={info ? (info.next ? `Service ${info.active} · ${fmt(info.next)}` : 'Entitlement habis') : 'Isi Tanggal Aplikasi Coating'} /></Field>
        <Field id="st" label="Status Follow Up"><Select id="st" v={f.status} list={STATUSES} on={(v) => set('status', v as Status)} /></Field>
        {f.status === 'GOAL (Service)' && initial?.status !== 'GOAL (Service)' && <p className="rounded-xl bg-green-50 p-2 text-xs text-green-800">Menyimpan dengan status GOAL akan menandai service aktif sebagai selesai.</p>}
        {f.status === 'Follow Up Ulang' && <Field id="rd" label="Follow Up Ulang Tanggal" k="rescheduleDate"><input id="rd" type="date" className="input" value={f.rescheduleDate} onChange={(e) => set('rescheduleDate', e.target.value)} /></Field>}
        {f.status === 'CANCEL (Batal)' && <Field id="cr" label="Alasan Cancel"><input id="cr" className="input" value={f.cancelReason} onChange={(e) => set('cancelReason', e.target.value)} /></Field>}
        <Field id="nt" label="Catatan"><textarea id="nt" rows={3} className="input" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        {initial && info && <div><div className="label">Riwayat Service</div><ServiceHistory rows={serviceRows(preview)} /></div>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Batal</button>
          <button type="submit" className="btn-primary">Simpan</button>
        </div>
      </form>
    </Modal>
  );
}
