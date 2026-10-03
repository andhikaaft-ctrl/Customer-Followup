import { FormEvent, useState } from 'react';
import { Customer, CustomerInput, STATUSES, Status } from '../types';
import { Modal } from './Modal';
import { isValidISO, fmt } from '../utils/date';
import { isValidWA, normalizeWA, serviceDate } from '../utils/customer';

const empty: CustomerInput = { name: '', whatsapp: '', licensePlate: '', chassisNumber: '', engineNumber: '', purchaseDate: '', status: 'Menunggu Jadwal', rescheduleDate: '', cancelReason: '', notes: '' };

export function CustomerForm({ initial, onSave, onClose }: { initial?: Customer; onSave: (d: CustomerInput) => Promise<void>; onClose: () => void }) {
  const [f, setF] = useState<CustomerInput>({ ...empty, ...initial });
  const [err, setErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof CustomerInput>(k: K, v: CustomerInput[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const x: Record<string, string> = {};
    if (!f.name.trim()) x.name = 'Nama wajib diisi.';
    if (!f.whatsapp.trim()) x.whatsapp = 'Nomor WhatsApp wajib diisi.';
    else if (!isValidWA(f.whatsapp)) x.whatsapp = 'Nomor tidak valid. Contoh: 08123456789';
    if (!f.purchaseDate) x.purchaseDate = 'Tanggal pembelian wajib diisi.';
    else if (!isValidISO(f.purchaseDate)) x.purchaseDate = 'Tanggal tidak valid.';
    if (f.status === 'Follow Up Ulang' && f.rescheduleDate && !isValidISO(f.rescheduleDate)) x.rescheduleDate = 'Tanggal tidak valid.';
    setErr(x);
    if (Object.keys(x).length) return;
    setSaving(true);
    try {
      await onSave({
        ...f, name: f.name.trim(), whatsapp: normalizeWA(f.whatsapp),
        licensePlate: f.licensePlate.trim().toUpperCase(),
        chassisNumber: f.chassisNumber.trim().toUpperCase(),
        engineNumber: f.engineNumber.trim().toUpperCase(),
        rescheduleDate: f.status === 'Follow Up Ulang' ? f.rescheduleDate : '',
        cancelReason: f.status === 'CANCEL (Batal)' ? f.cancelReason : '',
      });
    } catch {
      setErr({ save: 'Gagal menyimpan customer. Data isian tetap tersedia; coba lagi.' });
    } finally { setSaving(false); }
  };
  const Err = ({ k }: { k: string }) => (err[k] ? <p className="mt-1 text-xs text-red-600" role="alert">{err[k]}</p> : null);

  return (
    <Modal title={initial ? 'Edit Customer' : 'Tambah Customer'} onClose={() => { if (!saving) onClose(); }}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div><label className="label" htmlFor="name">Nama Customer</label>
          <input id="name" className="input" value={f.name} onChange={(e) => set('name', e.target.value)} autoFocus /><Err k="name" /></div>
        <div><label className="label" htmlFor="wa">No. WhatsApp</label>
          <input id="wa" className="input" inputMode="tel" placeholder="08123456789" value={f.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} /><Err k="whatsapp" /></div>
        <fieldset className="space-y-3 rounded-xl border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-700">Data Kendaraan</legend>
          <p className="text-xs text-slate-500">Opsional, dapat dilengkapi nanti.</p>
          <div><label className="label" htmlFor="license-plate">Nomor Plat</label>
            <input id="license-plate" className="input" placeholder="B 1234 ABC" value={f.licensePlate} onChange={(e) => set('licensePlate', e.target.value)} autoCapitalize="characters" /></div>
          <div><label className="label" htmlFor="chassis-number">Nomor Rangka</label>
            <input id="chassis-number" className="input" value={f.chassisNumber} onChange={(e) => set('chassisNumber', e.target.value)} autoCapitalize="characters" /></div>
          <div><label className="label" htmlFor="engine-number">Nomor Mesin</label>
            <input id="engine-number" className="input" value={f.engineNumber} onChange={(e) => set('engineNumber', e.target.value)} autoCapitalize="characters" /></div>
        </fieldset>
        <div><label className="label" htmlFor="pd">Tanggal Pembelian</label>
          <input id="pd" type="date" className="input" value={f.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} /><Err k="purchaseDate" />
          {isValidISO(f.purchaseDate) && <p className="mt-1 text-xs text-slate-500">Jadwal service pertama: <b>{fmt(serviceDate(f as Customer))}</b> (otomatis, +180 hari)</p>}</div>
        <div><label className="label" htmlFor="st">Status</label>
          <select id="st" className="input" value={f.status} onChange={(e) => set('status', e.target.value as Status)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        {f.status === 'Follow Up Ulang' && (
          <div><label className="label" htmlFor="rd">Follow Up Ulang Tanggal</label>
            <input id="rd" type="date" className="input" value={f.rescheduleDate} onChange={(e) => set('rescheduleDate', e.target.value)} /><Err k="rescheduleDate" /></div>)}
        {f.status === 'CANCEL (Batal)' && (
          <div><label className="label" htmlFor="cr">Alasan Cancel</label>
            <input id="cr" className="input" value={f.cancelReason} onChange={(e) => set('cancelReason', e.target.value)} /></div>)}
        <div><label className="label" htmlFor="nt">Catatan</label>
          <textarea id="nt" rows={3} className="input" value={f.notes} onChange={(e) => set('notes', e.target.value)} /></div>
        <Err k="save" />
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Batal</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
        </div>
      </form>
    </Modal>
  );
}
