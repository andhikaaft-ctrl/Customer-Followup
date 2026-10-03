import { Classification, Customer, Package, Status, Vehicle } from '../types';
import { addDays, todayISO } from '../utils/date';
import { buildHistory, SERVICE_INTERVAL } from '../utils/service';

/** done = service selesai; offset = hari dari hari ini ke jadwal service aktif (negatif = lewat). */
const s = (name: string, vehicleType: Vehicle, product: string, classification: Classification, servicePackage: Package, done: number, offset: number, status: Status, extra: Partial<Customer> = {}): Customer => {
  const t = todayISO(), now = new Date().toISOString();
  const coatingDate = addDays(t, offset - SERVICE_INTERVAL * (done + 1));
  return {
    id: crypto.randomUUID(), entryDate: addDays(coatingDate, -3), vehicleType, name, whatsapp: '62812345678' + String(10 + Math.abs(name.length * 7) % 90),
    product, classification, purchaseDate: addDays(coatingDate, -2), coatingDate, servicePackage, history: buildHistory(coatingDate, done), status,
    rescheduleDate: '', cancelReason: '', notes: '', createdAt: now, updatedAt: now, ...extra,
  };
};
export const makeSampleData = (): Customer[] => [
  s('Budi Santoso', 'Mobil', 'Ceramic Coating', 'B2C', 'Premium', 1, 0, 'GOAL (Service)', { notes: 'Service 1 selesai, Service 2 jatuh tempo hari ini' }),
  s('Siti Rahma', 'Motor', 'Paint Protection', 'B2C', 'Double', 0, -12, 'Sedang Di-Follow Up', { notes: 'Belum balas chat' }),
  s('Agus Wijaya', 'Mobil', 'Ceramic Coating', 'B2B', 'Premium', 0, -30, 'Menunggu Jadwal'),
  s('Dewi Lestari', 'Motor', 'Product A', 'B2B Retail', 'Double', 1, 45, 'GOAL (Service)'),
  s('Rudi Hartono', 'Mobil', 'Product B', 'B2C', 'Premium', 0, -15, 'CANCEL (Batal)', { cancelReason: 'Pindah kota' }),
  s('Maya Putri', 'Mobil', 'Ceramic Coating', 'B2C', 'Premium', 2, -5, 'Follow Up Ulang', { rescheduleDate: todayISO(), notes: 'Minta dihubungi hari ini' }),
  s('Hendra Gunawan', 'Motor', 'Paint Protection', 'B2B', 'Double', 0, 3, 'Menunggu Jadwal'),
  s('Lina Marlina', 'Mobil', 'Product A', 'B2B Retail', 'Premium', 1, 6, 'Sedang Di-Follow Up'),
  s('Tono Prasetyo', 'Motor', 'Ceramic Coating', 'B2C', 'Double', 2, 40, 'Follow Up Ulang', { rescheduleDate: addDays(todayISO(), 5) }),
  s('Fitri Handayani', 'Mobil', 'Paint Protection', 'B2B', 'Double', 4, 0, 'GOAL (Service)', { notes: 'Seluruh 4 service selesai' }),
];
