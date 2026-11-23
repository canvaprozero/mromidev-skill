# Paket ChatGPT dari-nol — video baru dari awal

Template untuk bikin video baru dari nol pakai ChatGPT Plus (chat web, BUKAN Codex).
ChatGPT yang menulis narasi dan kode animasinya; SRT dibuat ChatGPT dari audio,
dan ChatGPT juga yang membundel zip render-nya. Saya yang mengerjakan verifikasi
dan perbaikan zip-nya kalau ada yang kurang.

## Alur (6 langkah)

1. **Pilih topik, durasi, dan gaya.** Isi placeholder di
   `stage-1-narration-prompt.md` (TOPIK, DURASI, GAYA, NICHE), lalu paste
   prompt itu ke chat ChatGPT Plus baru. Upload juga
   `chatgpt-from-scratch.zip` ke chat yang sama supaya ChatGPT punya
   konteks proyeknya.
2. **Setujui narasinya** — cek jumlah kata, hook, dan alurnya.
3. **Generate audio di Google AI Studio**
   (https://aistudio.google.com/generate-speech): model
   `gemini-3.8-flash-tts`, voice + style sesuai saran ChatGPT, paste narasi
   BESERTA tag ekspresinya, download file audionya (wav). Satu file, narasi
   penuh sekaligus (bukan satu file per baris).
4. **Upload file audio itu (+ script narasi yang sudah disetujui) ke chat
   ChatGPT yang SAMA.** ChatGPT mentranskrip audionya dan membuat .srt
   dengan timestamp per kalimat. Syaratnya: narasi mulai tepat di detik 0
   dan audio dipakai utuh (tanpa intro, jeda tambahan, atau potongan) — itu
   memang alur kita. Kalau ada intro/jeda/potongan, kirim juga video
   finalnya. Kirim juga script aslinya supaya nama dan istilah khusus
   dieja dengan benar.
5. **Paste prompt `stage-2-scene-prompt.md` ke chat yang sama**
   (narasi + SRT sudah ada di chat dari langkah 4). ChatGPT menulis kode
   animasinya dari SRT itu, lalu membundel zip render-nya (boleh zip
   mandiri seperti Museum Mount Maker, boleh file scene saja).
6. **Kirim zip hasil ChatGPT ke saya di chat Motion Stock.** Saya
   verifikasi (tsc, stills QC, cross-check SRT/karaoke dengan Whisper)
   dan perbaiki kalau ada yang kurang — mis. render.bat supaya tidak
   download apa-apa di PC. Render di PC seperti biasa, upload mp4-nya
   kembali di kartu job.

## Satu syarat keras (lihat juga `chatgpt-format-spec.md`)

**Waktu render di PC, zip TIDAK BOLEH download apa-apa.** Node.js sudah
terinstal, node_modules bersama sudah ada di
`C:\Users\Cloudy\Videos\Motion\node_modules`, browser headless sudah ada
dari render sebelumnya. Selain syarat itu, cara ChatGPT membangun
paketnya bebas — yang dinilai hasil rendernya.

## Yang JANGAN diminta ke ChatGPT

- **JANGAN minta ChatGPT membuat SRT dari teks saja** (tanpa audio) — tanpa
  audio, timestamp-nya cuma estimasi dan bisa meleset.

## Pengaman (safety net)

Timestamp ChatGPT itu estimasi per segmen — cukup akurat untuk subtitle,
tapi kurang presisi dibanding Whisper untuk menggerakkan potongan animasi.
Begitu zip kembali, saya cross-check SRT-nya dengan audio asli pakai
Whisper (word-level alignment) dan koreksi timing scene-nya kalau meleset.
Audionya ada di dalam zip (atau dikirim terpisah kalau ChatGPT hanya
mengembalikan file scene).

## Isi paket

- `stage-1-narration-prompt.md` — prompt tahap 1 (narasi + tag ekspresi).
- `stage-2-scene-prompt.md` — prompt tahap 2 (kode animasi dari SRT).
- `chatgpt-format-spec.md` — koreksi format untuk ChatGPT (satu syarat
  keras: render di PC tanpa download).
- `chatgpt-from-scratch.zip` — snapshot proyek untuk di-upload ke ChatGPT:
  kode referensi fry cook 60 dtk + 13 file template bridge + `src/Root.tsx`
  + `package.json` (+ README dan kedua prompt di atas).
