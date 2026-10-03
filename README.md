# Customer Follow-Up Management

Aplikasi React + Vite + TypeScript + Tailwind untuk solo owner. Data customer tersimpan di Netlify Database dan dilindungi login Netlify Identity. Setiap akun hanya dapat mengakses data miliknya.

## Install & jalankan
```bash
npm install
netlify dev --port 8889 # development dengan API dan Identity
npm run build    # production build ke folder dist/
npm run preview  # coba hasil build
```

## Deploy
- **Netlify**: deploy repository dengan `netlify.toml`; aplikasi memerlukan Functions, Database, dan Identity, bukan hanya file statis `dist`.
- Skema berada di `db/schema.ts` dan migrasi di `netlify/database/migrations/` diterapkan saat deploy. Setelah mengubah skema, jalankan `npx drizzle-kit generate --name nama_perubahan`.
- Buat akun dan konfirmasi email sebelum masuk. Untuk membatasi aplikasi pada pemilik yang diundang, ubah Identity menjadi **Invite only** pada konfigurasi project dan undang akun pemilik.

## Cara pakai
1. **Dashboard**: ringkasan KPI, chart status, banner & daftar "Follow Up Hari Ini" (tombol WhatsApp).
2. **Data Customer**: tambah/edit/hapus, cari (nama, WhatsApp, nomor plat, nomor rangka, atau nomor mesin), filter status, "Jadwal Hari Ini", urutkan.
3. Jadwal service otomatis = Tanggal Pembelian + 180 hari. Status "Follow Up Ulang" memunculkan kolom tanggal.
4. OVERDUE muncul bila tanggal follow-up sudah lewat dan status belum GOAL/CANCEL.
5. Nomor `08123...` otomatis jadi `628123...` dan link `https://wa.me/628123...`.
6. **Data Kendaraan**: nomor plat, nomor rangka, dan nomor mesin bersifat opsional. Isian disimpan sebagai teks, dirapikan, dan diubah menjadi huruf kapital tanpa menghilangkan nol di depan. Ketiganya tampil pada tabel desktop maupun kartu mobile.

## Struktur data customer
```ts
{ id, name, whatsapp /*628..*/, licensePlate, chassisNumber, engineNumber,
  purchaseDate /*YYYY-MM-DD*/, status,
  rescheduleDate, cancelReason, notes, createdAt, updatedAt }
```
`firstServiceDate` tidak disimpan, selalu dihitung dari `purchaseDate` agar tidak pernah tidak konsisten.

## Backup / restore
Menu **Data Management**: Export JSON (backup), Import JSON (restore, mengganti data), Export CSV (Excel/Sheets), Reset Demo Data, Clear All Data.
JSON dan CSV menyertakan ketiga kolom kendaraan. Backup JSON lama yang belum memiliki kolom tersebut tetap dapat diimport; nilainya diisi kosong.
Data lama dari browser (`cfm.customers.v1`) dipindahkan ke akun saat pertama kali login pada browser yang sama. Salinan browser hanya dihapus setelah penyimpanan database berhasil; kegagalan menampilkan pesan dan tombol coba lagi. Data milik akun lain tidak dapat diakses atau diganti.
Akun baru dimulai tanpa data demo. Gunakan **Reset Demo Data** jika memerlukan contoh. Lakukan Export JSON secara berkala, terutama sebelum import atau menghapus data.

## Update: Coating Service Management
- Jadwal service dihitung dari **Tanggal Aplikasi Coating**: Service n = tanggal coating + 180 × n hari. Semua logika ada di `src/utils/service.ts` (single source of truth).
- Premium = 6 service, Double = 4 service (Service 1 sudah termasuk). Sisa = total − selesai. Hanya service yang ditandai selesai (tombol **Service Selesai** atau status GOAL) yang mengurangi sisa.
- Data lama (v1) otomatis dimigrasi saat dibaca: coating date ← tanggal pembelian, paket default Premium, record GOAL lama dihitung 1 service selesai.
- Excel: Data Management → Download Template / Import Excel (preview + deteksi duplikat Nama+No. Tlp) / Export Excel. Semua diproses di browser (SheetJS `xlsx`).
