export const STATUSES = ['Menunggu Jadwal', 'Sedang Di-Follow Up', 'GOAL (Service)', 'CANCEL (Batal)', 'Follow Up Ulang'] as const;
export type Status = (typeof STATUSES)[number];
export type Page = 'dashboard' | 'customers' | 'data';

/** firstServiceDate tidak disimpan: selalu dihitung dari purchaseDate (+180 hari) agar konsisten. */
export interface Customer {
  id: string;
  name: string;
  whatsapp: string; // format 628xxxxxxxxx
  licensePlate: string;
  chassisNumber: string;
  engineNumber: string;
  purchaseDate: string; // YYYY-MM-DD
  status: Status;
  rescheduleDate: string; // YYYY-MM-DD atau ''
  cancelReason: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export type CustomerInput = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>;
