# Arkana POS

Point of Sale webapp untuk **Arkana Coffee** — dashboard insight harian, kasir, antrian order real-time, inventori, dan laporan penjualan. Dibangun dengan Next.js 16 + Supabase, siap deploy ke Vercel.

## Fitur

- **Login berbasis role** — Owner, Barista, Cashier (akses halaman otomatis dibatasi sesuai role di database, bukan cuma tab yang dipilih saat login)
- **Dashboard** (Owner) — pendapatan hari ini, jumlah order, rata-rata nilai order, grafik 7 hari, menu terlaris, alert stok menipis
- **Kasir (POS)** — grid produk per kategori, keranjang, pilih meja/take away, bayar cash atau QRIS, cetak struk
- **Antrian Order** (Barista/Owner/Cashier) — papan kanban Menunggu → Diproses → Siap Diantar → Selesai, update real-time lintas device via Supabase Realtime
- **Inventori** — kelola menu, kategori, dan stok; badge otomatis saat stok menipis; stok otomatis berkurang saat ada order
- **Laporan** — riwayat transaksi dengan filter tanggal (hari ini/7 hari/30 hari/semua) + export CSV
- **Struk cetak** — halaman struk siap print (gaya thermal receipt)
- Responsif untuk **tablet, laptop, dan HP** (sidebar di layar besar, bottom nav di HP)

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Auth + Realtime) · Recharts

---

## 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com) (gratis).
2. Buka **SQL Editor** → **New query**, copy-paste seluruh isi file `supabase/schema.sql` dari project ini, lalu klik **Run**.
   Ini akan membuat semua tabel, aturan keamanan (RLS), fungsi checkout, dan mengisi beberapa menu contoh.
3. Buka **Project Settings → API**, catat:
   - `Project URL`
   - `anon public` key

## 2. Buat akun Owner pertama

1. Di Supabase Dashboard, buka **Authentication → Users → Add user**.
2. Isi email & password, lalu simpan. (Ini otomatis membuat baris di tabel `profiles` dengan role default `cashier`.)
3. Buka **Table Editor → profiles**, cari baris user tadi, ubah kolom `role` menjadi `owner`. Isi juga `full_name` sesuai nama staff.
4. Untuk menambah staff **barista** atau **cashier** lain, ulangi langkah yang sama (Add user → edit role di tabel `profiles`).

## 3. Jalankan secara lokal

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` dengan URL & anon key dari langkah 1:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

Lalu:

```bash
npm run dev
```

Buka `http://localhost:3000` dan login dengan akun owner yang sudah dibuat.

## 4. Deploy ke Vercel

1. Push folder project ini ke repository GitHub baru.
2. Buka [vercel.com/new](https://vercel.com/new), import repo tersebut.
3. Saat konfigurasi, tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Setelah selesai, webapp bisa diakses dari domain Vercel-nya (bisa dibuka di tablet, laptop, atau HP).

> Setiap kali push ke branch utama, Vercel akan otomatis build ulang.

## Struktur project

```
app/
  login/            halaman login
  (app)/            halaman yang butuh login (dashboard, pos, orders, inventory, reports, receipt)
  actions.ts         server actions (checkout, update status, kelola stok/produk)
components/
  ui/                komponen dasar (Button, Card, Modal, dst) + logo
  layout/            sidebar & bottom nav
  dashboard/ pos/ orders/ inventory/ reports/ receipt/
lib/
  supabase/          client Supabase (browser, server, middleware)
  auth.ts            helper cek sesi & role
  types.ts            tipe data
  utils.ts            format Rupiah, tanggal, dsb
supabase/
  schema.sql          skema database lengkap — jalankan ini di Supabase SQL Editor
```

## Catatan

- Pembayaran QRIS saat ini dicatat manual (belum terhubung ke payment gateway) — sesuai kebutuhan awal. Integrasi gateway bisa ditambahkan belakangan di `app/actions.ts`.
- Warna, font, dan logo mengikuti style guide Arkana (`#7030EF`, `#DB1FFF`, `#090820`, General Sans).
- Kalau butuh fitur tambahan (multi-cabang, cetak struk ke printer thermal langsung, laporan lebih detail, dll), tinggal bilang — struktur project ini sudah modular jadi gampang dikembangkan.
