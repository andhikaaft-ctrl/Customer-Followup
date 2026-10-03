import { CLASSES, Customer, PACKAGES, STATUSES, Status, VEHICLES, ServiceRecord } from '../types';
import { fmt, isValidISO, todayISO } from './date';
import { buildHistory, calc, TOTAL_SERVICES } from './service';
import { isValidWA, normalizeWA } from './whatsapp';

export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
export const exportJSON = (cs: Customer[]) =>
  download('customers.json', JSON.stringify({ version: 2, customers: cs }, null, 2), 'application/json');

/** Baris export (dipakai CSV & Excel) agar kolom selalu sama. */
export function exportRows(cs: Customer[]) {
  return cs.map((c) => {
    const i = calc(c);
    return {
      'Tgl Masuk': fmt(c.entryDate), 'Jenis Kendaraan': c.vehicleType, 'Nama Customer': c.name, 'No. Tlp': c.whatsapp,
      'Jenis Product': c.product, Klasifikasi: c.classification, 'Tanggal Pembelian': fmt(c.purchaseDate),
      'Tanggal Aplikasi Coating': fmt(c.coatingDate), 'Jenis Layanan': c.servicePackage, 'Total Service': i.total,
      'Service Selesai': i.completed, 'Service Tersisa': i.remaining, 'Service Berikutnya': i.active ? `Service ${i.active}` : 'Entitlement Habis',
      'Tanggal Service Berikutnya': fmt(i.next ?? ''), 'Status Follow Up': c.status, 'Follow Up Ulang': fmt(c.rescheduleDate),
      'Alasan Cancel': c.cancelReason, Catatan: c.notes,
    };
  });
}
export function exportCSV(cs: Customer[]) {
  const rows = exportRows(cs), head = Object.keys(exportRows([])[0] ?? { x: 1 });
  const keys = rows.length ? Object.keys(rows[0]) : head;
  const q = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  download('customers.csv', '\uFEFF' + [keys.map(q).join(','), ...rows.map((r) => keys.map((k) => q((r as Record<string, unknown>)[k])).join(','))].join('\r\n'), 'text/csv;charset=utf-8');
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');
const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T => ((list as readonly string[]).includes(str(v)) ? (v as T) : d);
/** Migrasi + validasi satu record (mendukung data lama v1 tanpa field coating/package/history). */
export function sanitize(raw: unknown): Customer | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name).trim(), wa = str(r.whatsapp);
  const pd = isValidISO(str(r.purchaseDate)) ? str(r.purchaseDate) : str(r.coatingDate);
  if (!name || !isValidWA(wa) || !isValidISO(pd)) return null;
  const coating = isValidISO(str(r.coatingDate)) ? str(r.coatingDate) : pd; // fallback ke tanggal pembelian
  const pkg = pick(r.servicePackage, PACKAGES, 'Premium'), total = TOTAL_SERVICES[pkg];
  const status: Status = pick(r.status, STATUSES, 'Menunggu Jadwal');
  let history: ServiceRecord[];
  if (Array.isArray(r.history)) {
    history = r.history.filter((h) => h && isValidISO(str(h.scheduledDate)) && isValidISO(str(h.completedDate)))
      .slice(0, total).map((h, i) => ({ serviceNumber: i + 1, scheduledDate: h.scheduledDate, completedDate: h.completedDate }));
  } else {
    const n = typeof r.completedServiceCount === 'number' ? r.completedServiceCount : status === 'GOAL (Service)' ? 1 : 0;
    history = buildHistory(coating, Math.max(0, Math.min(total, Math.floor(n))));
  }
  const now = new Date().toISOString(), rd = str(r.rescheduleDate);
  return {
    id: str(r.id) || crypto.randomUUID(), entryDate: isValidISO(str(r.entryDate)) ? str(r.entryDate) : pd,
    vehicleType: pick(r.vehicleType, VEHICLES, VEHICLES[0]), name, whatsapp: normalizeWA(wa), product: str(r.product).trim() || '-',
    classification: pick(r.classification, CLASSES, 'B2C'), purchaseDate: pd, coatingDate: coating, servicePackage: pkg, history, status,
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
export const today = todayISO;
