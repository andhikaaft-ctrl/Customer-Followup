import { Customer, STATUSES, Status } from '../types';
import { fmt, isValidISO } from './date';
import { isValidWA, normalizeWA, serviceDate } from './customer';

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
export const exportJSON = (cs: Customer[]) =>
  download('customers.json', JSON.stringify({ version: 1, customers: cs }, null, 2), 'application/json');

export function exportCSV(cs: Customer[]) {
  const head = ['Nama', 'WhatsApp', 'Tanggal Pembelian', 'Jadwal Service', 'Status', 'Follow Up Ulang', 'Alasan Cancel', 'Catatan'];
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = cs.map((c) => [c.name, c.whatsapp, fmt(c.purchaseDate), fmt(serviceDate(c)), c.status, fmt(c.rescheduleDate), c.cancelReason, c.notes].map(q).join(','));
  download('customers.csv', '\uFEFF' + [head.map(q).join(','), ...rows].join('\r\n'), 'text/csv;charset=utf-8');
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');
/** Validasi & normalisasi satu baris data; return null jika tidak valid. */
export function sanitize(raw: unknown): Customer | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name).trim(), wa = str(r.whatsapp), pd = str(r.purchaseDate);
  if (!name || !isValidWA(wa) || !isValidISO(pd)) return null;
  const status = (STATUSES as readonly string[]).includes(str(r.status)) ? (r.status as Status) : 'Menunggu Jadwal';
  const rd = str(r.rescheduleDate);
  const now = new Date().toISOString();
  return {
    id: str(r.id) || crypto.randomUUID(), name, whatsapp: normalizeWA(wa), purchaseDate: pd, status,
    rescheduleDate: isValidISO(rd) ? rd : '', cancelReason: str(r.cancelReason), notes: str(r.notes),
    createdAt: str(r.createdAt) || now, updatedAt: str(r.updatedAt) || now,
  };
}
export function parseImport(text: string): Customer[] {
  let data: unknown;
  try { data = JSON.parse(text); } catch { throw new Error('File bukan JSON yang valid.'); }
  const list = Array.isArray(data) ? data : (data as { customers?: unknown })?.customers;
  if (!Array.isArray(list)) throw new Error('Format tidak dikenali. Gunakan file hasil Export JSON.');
  const ok = list.map(sanitize).filter((c): c is Customer => c !== null);
  if (list.length > 0 && ok.length === 0) throw new Error('Tidak ada data customer yang valid di file ini.');
  return ok;
}
