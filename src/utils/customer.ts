import { Customer, Status } from '../types';
import { addDays, diffDays } from './date';

export const SERVICE_DAYS = 180;
const DONE: Status[] = ['GOAL (Service)', 'CANCEL (Batal)'];
export const isDone = (c: Customer) => DONE.includes(c.status);
export const serviceDate = (c: Customer) => addDays(c.purchaseDate, SERVICE_DAYS);

export function normalizeWA(raw: string) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('0')) d = '62' + d.slice(1);
  else if (d.startsWith('8')) d = '62' + d;
  return d;
}
export const isValidWA = (raw: string) => /^628\d{8,12}$/.test(normalizeWA(raw));
export const waLink = (raw: string) => `https://wa.me/${normalizeWA(raw)}`;

/** Tanggal follow-up berikutnya: tanggal ulang (jika status Follow Up Ulang) atau jadwal service. */
export const nextDate = (c: Customer) =>
  c.status === 'Follow Up Ulang' && c.rescheduleDate ? c.rescheduleDate : serviceDate(c);
export const isDueToday = (c: Customer, today: string) => !isDone(c) && nextDate(c) === today;
export const overdueDays = (c: Customer, today: string) => (isDone(c) ? 0 : Math.max(0, diffDays(today, nextDate(c))));
export const isUpcoming = (c: Customer, today: string) => {
  if (isDone(c)) return false;
  const d = diffDays(nextDate(c), today);
  return d > 0 && d <= 7;
};
export const conversionRate = (cs: Customer[]) => {
  const g = cs.filter((c) => c.status === 'GOAL (Service)').length;
  const x = cs.filter((c) => c.status === 'CANCEL (Batal)').length;
  return g + x === 0 ? 0 : Math.round((g / (g + x)) * 100);
};
