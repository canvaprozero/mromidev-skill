# SFX — earshot palette

27 suara earshot (bank-only, deterministik, seed 1) sebagai WAV
24 kHz mono, siap dipakai sebagai SFX video. Lihat `PALETTE.md`
untuk pemetaan moment → family → file, aturan rotasi varian, dan
rentang volume. Campur cue dengan `mix_sfx.py`:

```bash
# cues.json: [{"file": "pop_soft.wav", "at": 3.2, "vol": 0.5}, ...]
python3 mix_sfx.py --cues cues.json --dur 60 --wind 60 --out sfx.wav
```

## Asal-usul

Palet ini di-render dari earshot bank (server `earshot-venv`,
commit `591fa3e`): `bank.render(sound_id, seed=1, sr=48000)`
lalu ffmpeg resample ke 24 kHz mono. Pengecualian:
`whoosh_fast/crisp` memakai `dur=0.8, apex=0.32`.

Generator earshot: [Leonxlnx/earshot](https://github.com/Leonxlnx/earshot)
(v1.0.0) — video Museum Mount Maker memakai 4 suara yang
di-generate langsung dari earshot v1.0.0 (lihat
`production-notes.json` di video itu: `ceramic-tap-a/b`,
`bracket-slide`, `phone-shutter`).

Earshot tidak punya wind bed panjang, jadi bed atmosfer tetap
synth lama yang sudah di-port ke dalam `mix_sfx.py` (`--wind`,
seed `20261031`, deterministik).

## Aturan yang mengikat

SFX hanya bila gambar tidak bisa menyampaikannya (atmosfer/angin,
transisi/whoosh, reveal/pop, penutup/chime). **JANGAN PERNAH**
suara tubuh literal (napas, langkah kaki, makan) — narasi sudah
menyampaikannya.

Aturan variasi: pilih family berdasarkan jenis momen, lalu rotasi
varian di dalam family di sepanjang video — jangan pernah file
yang sama dua kali berturut-turut. Mixer memberi WARNING bila ada
pengulangan berurutan.
