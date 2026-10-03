import { ChangeEvent, useRef, useState } from 'react';
import { Customer, CustomerInput } from '../types';
import { ParsedRow, readExcel } from '../utils/excel';

export function ExcelImport({ existing, onImport, onMessage }: { existing: Customer[]; onImport: (d: CustomerInput[]) => void; onMessage: (ok: boolean, t: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [anyway, setAnyway] = useState(false);
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    try { setRows(await readExcel(f, existing)); setAnyway(false); }
    catch (err) { setRows(null); onMessage(false, err instanceof Error ? err.message : 'Gagal membaca file.'); }
  };
  const valid = rows?.filter((r) => r.data && !r.errors.length) ?? [];
  const dup = valid.filter((r) => r.duplicate), toImport = valid.filter((r) => anyway || !r.duplicate);
  const result = (r: ParsedRow) => (r.errors.length ? r.errors.join('; ') : r.duplicate ? (anyway ? 'Duplikat (akan diimport)' : 'Duplikat (dilewati)') : 'Valid');
  return (
    <>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} aria-label="File Excel" />
      <button className="btn-ghost min-h-11" onClick={() => ref.current?.click()}>Import Excel</button>
      {rows && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4">
          <div role="dialog" aria-modal="true" aria-label="Preview import Excel" className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-3xl sm:rounded-2xl">
            <h2 className="mb-2 text-lg font-semibold">Preview Import Excel</h2>
            <p className="mb-3 text-sm text-slate-600">Baris: <b>{rows.length}</b> · Valid: <b className="text-green-700">{valid.length}</b> · Error: <b className="text-red-600">{rows.length - valid.length}</b> · Potensi duplikat: <b className="text-amber-600">{dup.length}</b></p>
            {dup.length > 0 && <label className="mb-3 flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-teal-700" checked={anyway} onChange={(e) => setAnyway(e.target.checked)} />Import Anyway (duplikat tetap diimport; default: dilewati)</label>}
            <div className="overflow-auto rounded-xl ring-1 ring-slate-200">
              <table className="w-full text-left text-sm"><thead className="bg-slate-50"><tr>{['Row', 'Customer', 'Phone', 'Package', 'Result'].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-slate-100">{rows.map((r) => (
                  <tr key={r.row} className={r.errors.length ? 'bg-red-50' : r.duplicate ? 'bg-amber-50' : ''}>
                    <td className="px-3 py-2">{r.row}</td><td className="px-3 py-2">{r.name || '-'}</td><td className="px-3 py-2">{r.phone || '-'}</td><td className="px-3 py-2">{r.pkg || '-'}</td><td className="px-3 py-2">{result(r)}</td></tr>))}</tbody></table>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost min-h-11" onClick={() => setRows(null)}>Batalkan</button>
              <button className="btn-primary min-h-11" disabled={!toImport.length} onClick={() => { onImport(toImport.map((r) => r.data!)); onMessage(true, `${toImport.length} customer berhasil diimport.`); setRows(null); }}>Import {toImport.length} Customer</button>
            </div>
          </div>
        </div>)}
    </>
  );
}
