import { Customer, Status } from '../types';
import { addDays, todayISO } from '../utils/date';
import { SERVICE_DAYS } from '../utils/customer';

/** offset = selisih hari jadwal service dari hari ini (negatif = sudah lewat). */
const s = (name: string, wa: string, offset: number, status: Status, extra: Partial<Customer> = {}): Customer => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(), name, whatsapp: wa, purchaseDate: addDays(todayISO(), offset - SERVICE_DAYS), status,
    rescheduleDate: '', cancelReason: '', notes: '', createdAt: now, updatedAt: now, ...extra,
  };
};
export const makeSampleData = (): Customer[] => {
  const t = todayISO();
  return [
    s('Budi Santoso', '6281234567801', 0, 'Menunggu Jadwal', { notes: 'Beli paket premium' }),
    s('Siti Rahma', '6281234567802', -12, 'Sedang Di-Follow Up', { notes: 'Belum balas chat' }),
    s('Agus Wijaya', '6281234567803', -30, 'Menunggu Jadwal'),
    s('Dewi Lestari', '6281234567804', -20, 'GOAL (Service)', { notes: 'Service sudah dijadwalkan' }),
    s('Rudi Hartono', '6281234567805', -15, 'CANCEL (Batal)', { cancelReason: 'Pindah kota' }),
    s('Maya Putri', '6281234567806', -5, 'Follow Up Ulang', { rescheduleDate: t, notes: 'Minta dihubungi hari ini' }),
    s('Hendra Gunawan', '6281234567807', 3, 'Menunggu Jadwal'),
    s('Lina Marlina', '6281234567808', 6, 'Sedang Di-Follow Up'),
    s('Tono Prasetyo', '6281234567809', 40, 'Follow Up Ulang', { rescheduleDate: addDays(t, 5) }),
    s('Fitri Handayani', '6281234567810', 60, 'Menunggu Jadwal'),
  ];
};
