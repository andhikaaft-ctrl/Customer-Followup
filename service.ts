// SINGLE SOURCE OF TRUTH untuk seluruh perhitungan service. Jangan hitung ulang di tempat lain.
import { Customer, Package, ServiceRecord } from '../types';
import { addDays, diffDays, todayISO } from './date';

export const SERVICE_INTERVAL = 180;
export const TOTAL_SERVICES: Record<Package, number> = { Premium: 6, Double: 4 }; // Service 1 sudah termasuk
/** Service ke-n = tanggal aplikasi coating + 180*n hari (setara previousScheduled + 180). */
export const scheduledDate = (coating: string, n: number) => addDays(coating, SERVICE_INTERVAL * n);

export type ServiceState = 'Entitlement Habis' | 'Overdue' | 'Due Today' | 'Upcoming' | 'Batal';
export interface ServiceInfo {
  total: number; completed: number; remaining: number;
  active: number | null; next: string | null; // nomor & tanggal service aktif
  cancelled: boolean; actionable: boolean; // actionable: masih ada service & tidak CANCEL
  overdueDays: number; dueToday: boolean; upcoming7: boolean; followUpToday: boolean; state: ServiceState;
}

export function calc(c: Customer, today = todayISO()): ServiceInfo {
  const total = TOTAL_SERVICES[c.servicePackage];
  const completed = Math.min(c.history.length, total), remaining = total - completed;
  const active = remaining > 0 ? completed + 1 : null;
  const next = active ? scheduledDate(c.coatingDate, active) : null;
  const cancelled = c.status === 'CANCEL (Batal)', actionable = remaining > 0 && !cancelled;
  const d = next ? diffDays(next, today) : 0;
  const overdueDays = actionable && d < 0 ? -d : 0, dueToday = actionable && d === 0;
  const upcoming7 = actionable && d >= 0 && d <= 7;
  const followUpToday = actionable && (d === 0 || (c.status === 'Follow Up Ulang' && c.rescheduleDate === today));
  const state: ServiceState = remaining === 0 ? 'Entitlement Habis' : cancelled ? 'Batal' : overdueDays ? 'Overdue' : dueToday ? 'Due Today' : 'Upcoming';
  return { total, completed, remaining, active, next, cancelled, actionable, overdueDays, dueToday, upcoming7, followUpToday, state };
}

export function buildHistory(coating: string, n: number, today = todayISO()): ServiceRecord[] {
  return Array.from({ length: n }, (_, i) => {
    const s = scheduledDate(coating, i + 1);
    return { serviceNumber: i + 1, scheduledDate: s, completedDate: diffDays(s, today) > 0 ? today : s };
  });
}
/** Tandai service aktif selesai: completed+1, status jadi GOAL. */
export function completeNext(c: Customer): Customer {
  const i = calc(c);
  if (i.active === null || i.next === null) return c;
  return { ...c, status: 'GOAL (Service)', history: [...c.history, { serviceNumber: i.active, scheduledDate: i.next, completedDate: todayISO() }] };
}
export interface ServiceRow { serviceNumber: number; scheduledDate: string; completedDate: string; status: 'Completed' | 'Overdue' | 'Due' | 'Upcoming' }
export function serviceRows(c: Customer, today = todayISO()): ServiceRow[] {
  return Array.from({ length: TOTAL_SERVICES[c.servicePackage] }, (_, k) => {
    const n = k + 1, h = c.history.find((x) => x.serviceNumber === n), s = scheduledDate(c.coatingDate, n), d = diffDays(s, today);
    return { serviceNumber: n, scheduledDate: s, completedDate: h?.completedDate ?? '', status: h ? 'Completed' : d < 0 ? 'Overdue' : d === 0 ? 'Due' : 'Upcoming' };
  });
}
