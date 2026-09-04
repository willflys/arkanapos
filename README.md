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
