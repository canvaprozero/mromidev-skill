# Koreksi format — baca sebelum video berikutnya

Paket Museum Mount Maker sudah bagus — kodenya jalan, dan pendekatan zip mandiri + renderer sendiri itu sah. Ada SATU syarat yang harus dipenuhi, dan ini satu-satunya yang penting:

**Waktu render di PC, tidak boleh ada lagi yang di-download.**

Artinya, waktu render.bat dijalankan pertama kali di PC (Windows, user "Cloudy"), dia TIDAK BOLEH mengunduh: Node.js portable, `npm ci` / dependensi, atau browser/Chromium. Semua itu sudah ada di PC:
- Node.js v26.13.1 sudah terinstal — pakai yang di PATH (cek major version ≥ 20)
- node_modules bersama sudah ada di `C:\Users\Cloudy\Videos\Motion\node_modules` — pakai yang itu; instal baru hanya kalau folder itu tidak ketemu
- Browser headless (chrome-headless-shell.exe) sudah ada dari render sebelumnya — cari dulu dan pakai; download hanya sebagai fallback terakhir kalau benar-benar tidak ketemu

Internet di PC itu lemot — unduhan pertama ratusan MB adalah masalah praktis terbesar. Selain syarat itu, cara kamu membangun paketnya bebas: boleh zip mandiri seperti Museum Mount Maker, boleh kembalikan file scene saja. Yang dinilai adalah hasil rendernya.

Dua catatan soal hasil akhir (bukan aturan paket):
- Font: karaoke dan judul akhir harus pakai Poppins Bold, bukan Arial — sertakan `src/fonts.css` (saya sediakan) dan import di entry point.
- Output mp4 harus faststart (moov atom di depan), supaya bisa langsung diputar saat dilampirkan di chat.
