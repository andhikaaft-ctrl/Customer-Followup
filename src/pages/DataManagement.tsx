import { ChangeEvent, useRef, useState } from 'react';
import { Customer } from '../types';
import { ConfirmDialog } from '../components/Modal';
import { exportCSV, exportJSON, parseImport } from '../utils/io';

interface Props { customers: Customer[]; saveError: string; onReplace: (c: Customer[]) => void; onResetDemo: () => void; onClear: () => void }
type Pending = { msg: string; label: string; run: () => void } | null;

export function DataManagement({ customers, saveError, onReplace, onResetDemo, onClear }: Props) {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, setPending] = useState<Pending>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try {
      const list = parseImport(await f.text());
      setPending({ msg: `Import ${list.length} customer? Seluruh data saat ini akan diganti.`, label: 'Import',
        run: () => { onReplace(list); setMsg({ ok: true, text: `${list.length} customer berhasil diimport.` }); } });
    } catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal membaca file.' }); }
  };
  const Row = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="font-medium">{title}</div><div className="text-sm text-slate-500">{desc}</div></div>{children}</div>);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Data Management</h1>
      {(msg || saveError) && <div role="alert" className={`rounded-2xl p-3 text-sm ring-1 ${msg?.ok && !saveError ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-800 ring-red-200'}`}>{saveError || msg?.text}</div>}
      <section className="card divide-y divide-slate-100 !py-0">
        <Row title="Export JSON" desc="Backup seluruh data / pindah ke browser lain."><button className="btn-primary" onClick={() => exportJSON(customers)}>Export JSON</button></Row>
        <Row title="Import JSON" desc="Upload file hasil Export JSON (mengganti data saat ini)."><>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={onFile} aria-label="File JSON" />
          <button className="btn-ghost" onClick={() => file.current?.click()}>Import JSON</button></></Row>
        <Row title="Export CSV" desc="Buka di Excel atau Google Sheets."><button className="btn-ghost" onClick={() => exportCSV(customers)}>Export CSV</button></Row>
        <Row title="Reset Demo Data" desc="Ganti seluruh data dengan 10 contoh customer."><button className="btn-ghost" onClick={() => setPending({ msg: 'Data saat ini akan diganti dengan data demo. Lanjutkan?', label: 'Reset', run: () => { onResetDemo(); setMsg({ ok: true, text: 'Data demo dimuat.' }); } })}>Reset Demo Data</button></Row>
        <Row title="Clear All Data" desc="Hapus semua customer secara permanen."><button className="btn-danger" onClick={() => setPending({ msg: 'Semua data customer akan dihapus permanen. Lanjutkan?', label: 'Hapus Semua', run: () => { onClear(); setMsg({ ok: true, text: 'Semua data dihapus.' }); } })}>Clear All Data</button></Row>
      </section>
      {pending && <ConfirmDialog message={pending.msg} confirmLabel={pending.label} onCancel={() => setPending(null)} onConfirm={() => { pending.run(); setPending(null); }} />}
    </div>
  );
}
