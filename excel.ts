import { CLASSES, Customer, CustomerInput, PACKAGES, STATUSES, VEHICLES } from '../types';
import { addDays, isValidISO } from './date';
import { exportRows } from './io';
import { isValidWA, normalizeWA } from './whatsapp';

const ALIASES: Record<string, string[]> = {
  entryDate: ['tglmasuk', 'tanggalmasuk'], vehicleType: ['jeniskendaraan', 'kendaraan'], name: ['namacustomer', 'nama', 'customer'],
  whatsapp: ['notlp', 'notelp', 'notelepon', 'nomortelepon', 'nomortlp', 'whatsapp', 'wa', 'nowa', 'nowhatsapp'],
  product: ['jenisproduct', 'jenisproduk', 'product', 'produk'], classification: ['klasifikasi'],
  purchaseDate: ['tanggalpembelian', 'tglpembelian'], coatingDate: ['tanggalaplikasicoating', 'tglaplikasicoating', 'tglaplikasi', 'tanggalaplikasi', 'coatingdate'],
  servicePackage: ['jenislayanan', 'layanan', 'paket', 'package'], status: ['statusfollowup', 'status'],
  rescheduleDate: ['followupulang', 'followupulangtanggal'], cancelReason: ['alasancancel'], notes: ['catatan', 'notes'],
};
const REQUIRED: [string, string][] = [['entryDate', 'Tgl Masuk'], ['vehicleType', 'Jenis Kendaraan'], ['name', 'Nama Customer'], ['whatsapp', 'No. Tlp'],
  ['product', 'Jenis Product'], ['classification', 'Klasifikasi'], ['purchaseDate', 'Tanggal Pembelian'], ['coatingDate', 'Tanggal Aplikasi Coating'], ['servicePackage', 'Jenis Layanan']];
const norm = (s: unknown) => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

/** Serial Excel (UTC, tanpa timezone) atau DD/MM/YYYY atau YYYY-MM-DD -> YYYY-MM-DD. '' jika kosong, null jika tidak valid. */
export function toISODate(v: unknown): string | null {
  if (v === '' || v == null) return '';
  if (typeof v === 'number') return v > 0 ? addDays('1899-12-30', Math.floor(v)) : null;
  const s = String(v).trim(); if (!s) return '';
  let m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  const iso = m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : (m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)) ? m[0] : '';
  return isValidISO(iso) ? iso : null;
}
const en = <T extends string>(v: unknown, list: readonly T[]) => list.find((x) => norm(x) === norm(v));

export interface ParsedRow { row: number; name: string; phone: string; pkg: string; data?: CustomerInput; errors: string[]; duplicate: boolean }

export async function readExcel(file: File, existing: Customer[]): Promise<ParsedRow[]> {
  const XLSX = await import('xlsx');
  let rows: Record<string, unknown>[];
  try {
    const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', raw: true }); // raw: tanggal CSV tidak ditebak oleh library
    rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: true });
  } catch { throw new Error('File tidak bisa dibaca. Gunakan file .xlsx, .xls, atau .csv.'); }
  if (!rows.length) throw new Error('File kosong atau tidak ada baris data.');
  const map: Record<string, string> = {};
  for (const h of Object.keys(rows[0])) for (const [k, al] of Object.entries(ALIASES)) if (!map[k] && al.includes(norm(h))) map[k] = h;
  const missing = REQUIRED.filter(([k]) => !map[k]).map(([, l]) => l);
  if (missing.length) throw new Error(`Kolom wajib tidak ditemukan: ${missing.join(', ')}. Download template untuk format yang benar.`);
  const get = (r: Record<string, unknown>, k: string) => (map[k] ? r[map[k]] : '');
  const keys = new Set(existing.map((c) => `${c.whatsapp}|${c.name.toLowerCase()}`));
  return rows.map((r, i) => {
    const errors: string[] = [], text = (k: string) => String(get(r, k) ?? '').trim();
    const name = text('name'), phone = normalizeWA(text('whatsapp'));
    const req = (k: string, l: string) => { if (!text(k)) errors.push(`${l} kosong`); };
    REQUIRED.forEach(([k, l]) => req(k, l));
    if (text('whatsapp') && !isValidWA(phone)) errors.push('No. Tlp tidak valid');
    const date = (k: string, l: string) => { const d = toISODate(get(r, k)); if (d === null) errors.push(`${l} tidak valid`); return d ?? ''; };
    const entryDate = date('entryDate', 'Tgl Masuk'), purchaseDate = date('purchaseDate', 'Tanggal Pembelian'), coatingDate = date('coatingDate', 'Tanggal Aplikasi Coating'), rescheduleDate = date('rescheduleDate', 'Follow Up Ulang');
    const vehicleType = en(get(r, 'vehicleType'), VEHICLES), classification = en(get(r, 'classification'), CLASSES), servicePackage = en(get(r, 'servicePackage'), PACKAGES);
    if (text('vehicleType') && !vehicleType) errors.push(`Jenis Kendaraan harus: ${VEHICLES.join('/')}`);
    if (text('classification') && !classification) errors.push(`Klasifikasi harus: ${CLASSES.join('/')}`);
    if (text('servicePackage') && !servicePackage) errors.push(`Jenis Layanan harus: ${PACKAGES.join('/')}`);
    const status = text('status') ? en(get(r, 'status'), STATUSES) : 'Menunggu Jadwal';
    if (!status) errors.push('Status Follow Up tidak dikenal');
    const duplicate = keys.has(`${phone}|${name.toLowerCase()}`);
    keys.add(`${phone}|${name.toLowerCase()}`);
    const data = errors.length || !vehicleType || !classification || !servicePackage || !status ? undefined : {
      entryDate, vehicleType, name, whatsapp: phone, product: text('product'), classification, purchaseDate, coatingDate, servicePackage, status,
      rescheduleDate: status === 'Follow Up Ulang' ? rescheduleDate : '', cancelReason: status === 'CANCEL (Batal)' ? text('cancelReason') : '', notes: text('notes'),
    };
    return { row: i + 2, name, phone, pkg: String(servicePackage ?? text('servicePackage')), data, errors, duplicate };
  });
}

export async function downloadTemplate() {
  const XLSX = await import('xlsx');
  const h = ['Tgl Masuk', 'Jenis Kendaraan', 'Nama Customer', 'No. Tlp', 'Jenis Product', 'Klasifikasi', 'Tanggal Pembelian', 'Tanggal Aplikasi Coating', 'Jenis Layanan', 'Status Follow Up', 'Follow Up Ulang', 'Alasan Cancel', 'Catatan'];
  const ws = XLSX.utils.aoa_to_sheet([h,
    ['01/03/2026', 'Motor', 'CONTOH Budi (hapus baris contoh)', '08123456789', 'Ceramic Coating', 'B2C', '01/03/2026', '02/03/2026', 'Premium', 'Menunggu Jadwal', '', '', 'Baris contoh'],
    ['05/03/2026', 'Mobil', 'CONTOH Andi (hapus baris contoh)', '+62 812-3456-780', 'Paint Protection', 'B2B', '05/03/2026', '06/03/2026', 'Double', 'Follow Up Ulang', '15/10/2026', '', 'Baris contoh'],
    ['10/03/2026', 'Mobil', 'CONTOH Citra (hapus baris contoh)', '081298765432', 'Product A', 'B2B Retail', '10/03/2026', '12/03/2026', 'Premium', '', '', '', 'Baris contoh']]);
  ws['!cols'] = h.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Template'); XLSX.writeFile(wb, 'template-customer.xlsx');
}
export async function exportExcel(cs: Customer[]) {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportRows(cs)), 'Customer');
  XLSX.writeFile(wb, 'customers.xlsx');
}
