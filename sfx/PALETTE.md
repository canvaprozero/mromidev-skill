# SFX Palette — earshot bank for the current tools (2026-11-01)

Fixes the "itu-itu saja" problem: the old synth had exactly 4 timbres
(`wind_bed`, `pop`, `whoosh`, `chime`) for every cue, so 17 cues still
sounded like the same few sounds. This palette renders 27 distinct
earshot sounds (bank-only, deterministic, seed 1) as 24000 Hz mono WAVs
— the format the video pipeline assembles.

## Paths

- Server (assembly side): `~/claude-render/sfx/palette/24k/` (+ `48k/` audit renders)
- Workspace (builder side, byte-identical mirror): `~/workspace/motion-stock/sfx-palette/24k/`
- Mixer: `mix_sfx.py` next to this file (also mirrored to the server palette dir)

## Moment -> family -> files (rotate variants, never repeat a file in a row)

| Moment | Family | Files (variants) |
|---|---|---|
| Reveal, element/chip appears | pop | `pop_soft.wav`, `pop_wide.wav`, `pop_round.wav` |
| Data tick, counter, small UI | tick | `tick_soft.wav`, `tick_blip.wav` |
| Transition, slide bridge, fast move | whoosh | `whoosh_crisp.wav`, `whoosh_heavy.wav`, `whoosh_swish.wav` |
| Big scene change | whoosh_big | `whooshbig_gust.wav`, `whooshbig_deep.wav` |
| Chip/number lands | ting | `ting_m0.wav`, `ting_m1.wav`, `ting_tine.wav` |
| Closing, lockup | chime | `chime_glock.wav`, `chime_celesta.wav`, `chime_marimba.wav` |
| End-card sparkle, magic | sparkle | `sparkle_m1.wav`, `sparkle_kalimba.wav` |
| Crash, title slam, "pop" moment | impact | `impact_deep.wav`, `impact_punch.wav` |
| Bass-drop, weight after a crash | drop | `drop_808.wav`, `drop_sink.wav` |
| Build into a reveal | riser | `riser_build.wav`, `riser_swell.wav` |
| Squash rebound, playful bounce | rebound | `rebound_bloop.wav`, `rebound_fall.wav` |
| Object lands, knock | knock | `knock_wood.wav` |
| Atmosphere bed | wind (synth, see below) | `--wind` flag on the mixer |

## Variety rule (binding for cue designers)

1. Pick a **family** by moment type, never a fixed file.
2. Rotate variants inside the family across the video: `pop_soft` ->
   `pop_wide` -> `pop_round` -> `pop_soft` ... The mixer WARNS on an
   immediate repeat; a deliberate repeat must be justified in the cue
   design, not accidental.
3. Prefer palette files over synth for every family except wind.
4. Volumes (breath30 ranges): bed 0.22, ticks 0.3-0.4, moves 0.5,
   drops 0.55. Standing rule unchanged: SFX only when the picture
   cannot say it; **never literal body sounds** (breath, footsteps,
   eating).

## Wind bed exception

Earshot has no long wind bed category, so the wind bed stays the old
synth generator (ported into `mix_sfx.py` as `--wind`, seeded
`20261031`, deterministic). Everything else comes from the palette.

## Render recipe (reproducibility)

Server `earshot-venv` (bank-only, no torch), commit `591fa3e`:
`bank.render(sound_id, seed=1, sr=48000)` then ffmpeg resample to
24000 Hz mono. Exception: `whoosh_fast/crisp` uses `dur=0.8,
apex=0.32` (the proven stock knobs). The 4 pre-existing stock sounds
(`pop_soft` = `ui_pop/soft`, `whoosh_crisp` = `whoosh_fast/crisp`,
`chime_glock` = `mallet/glock`, plus `mallet/flourish` in the old
stock dir) render byte-identical under this recipe.

## Mixer usage

```bash
# cues.json: [{"file": "pop_soft.wav", "at": 3.2, "vol": 0.5}, ...]
python3 mix_sfx.py --cues cues.json --dur 31.73 --wind 31.73 --out sfx.wav
```

## Status

- Old synth (`synth_sfx.py` per-video copies): retired except the wind
  bed generator, which now lives in the mixer.
- Remotion path: drafted (2026-11-01) — this palette serves the
  current HTML pipeline; Remotion would use the same WAVs via its
  own audio path if un-drafted later.
