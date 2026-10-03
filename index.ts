export const STATUSES = ['Menunggu Jadwal', 'Sedang Di-Follow Up', 'GOAL (Service)', 'CANCEL (Batal)', 'Follow Up Ulang'] as const;
export const VEHICLES = ['Motor', 'Mobil'] as const; // tambah jenis kendaraan baru di sini
export const CLASSES = ['B2B', 'B2C', 'B2B Retail'] as const;
export const PACKAGES = ['Premium', 'Double'] as const;
export type Status = (typeof STATUSES)[number];
export type Vehicle = (typeof VEHICLES)[number];
export type Classification = (typeof CLASSES)[number];
export type Package = (typeof PACKAGES)[number];
export type Page = 'dashboard' | 'customers' | 'data';

/** Hanya service yang SELESAI yang disimpan. Jadwal & sisa entitlement selalu dihitung (utils/service.ts). */
export interface ServiceRecord { serviceNumber: number; scheduledDate: string; completedDate: string }
export interface Customer {
  id: string;
  entryDate: string; // YYYY-MM-DD
  vehicleType: Vehicle;
  name: string;
  whatsapp: string; // 628xxxxxxxxx
  product: string;
  classification: Classification;
  purchaseDate: string;
  coatingDate: string; // dasar jadwal service
  servicePackage: Package;
  history: ServiceRecord[]; // service yang sudah selesai
  status: Status;
  rescheduleDate: string;
  cancelReason: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'history'>;
