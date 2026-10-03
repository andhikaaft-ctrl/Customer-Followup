# Customer Follow-Up Management

Aplikasi React + Vite + TypeScript + Tailwind untuk solo owner. Data tersimpan di `localStorage` (tanpa backend/API key).

## Install & jalankan
```bash
npm install
npm run dev      # development (http://localhost:5173)
npm run build    # production build ke folder dist/
npm run preview  # coba hasil build
```

## Deploy
- **Vercel**: import repo, framework Vite (build `npm run build`, output `dist`). Atau `npx vercel`.
- **Netlify**: import repo (`netlify.toml` sudah ada), atau drag & drop folder `dist` ke app.netlify.com/drop.

## Cara pakai
1. **Dashboard**: ringkasan KPI, chart status, banner & daftar "Follow Up Hari Ini" (tombol WhatsApp).
2. **Data Customer**: tambah/edit/hapus, cari (nama/nomor), filter status, "Jadwal Hari Ini", urutkan.
3. Jadwal service otomatis = Tanggal Pembelian + 180 hari. Status "Follow Up Ulang" memunculkan kolom tanggal.
4. OVERDUE muncul bila tanggal follow-up sudah lewat dan status belum GOAL/CANCEL.
5. Nomor `08123...` otomatis jadi `628123...` dan link `https://wa.me/628123...`.

## Struktur data (`localStorage` key `cfm.customers.v1`)
```ts
{ id, name, whatsapp /*628..*/, purchaseDate /*YYYY-MM-DD*/, status,
  rescheduleDate, cancelReason, notes, createdAt, updatedAt }
```
`firstServiceDate` tidak disimpan, selalu dihitung dari `purchaseDate` agar tidak pernah tidak konsisten.

## Backup / restore
Menu **Data Management**: Export JSON (backup), Import JSON (restore, mengganti data), Export CSV (Excel/Sheets), Reset Demo Data, Clear All Data.
Data demo hanya dimuat saat pertama kali membuka aplikasi; data asli tidak pernah ditimpa otomatis.
Karena data ada di browser, lakukan Export JSON secara berkala.

## Update: Coating Service Management
- Jadwal service dihitung dari **Tanggal Aplikasi Coating**: Service n = tanggal coating + 180 × n hari. Semua logika ada di `src/utils/service.ts` (single source of truth).
- Premium = 6 service, Double = 4 service (Service 1 sudah termasuk). Sisa = total − selesai. Hanya service yang ditandai selesai (tombol **Service Selesai** atau status GOAL) yang mengurangi sisa.
- Data lama (v1) otomatis dimigrasi saat dibaca: coating date ← tanggal pembelian, paket default Premium, record GOAL lama dihitung 1 service selesai.
- Excel: Data Management → Download Template / Import Excel (preview + deteksi duplikat Nama+No. Tlp) / Export Excel. Semua diproses di browser (SheetJS `xlsx`).
