# mromidev-skill

The complete workflow for making **"how it feels to be a
[profession]"** videos in the **Mromidev 3D** style: 2D billboard
cartoon characters in a 3D toon world, built with Remotion +
three.js. Written as a skill so it can be handed to any AI agent
as context — the writer may be ChatGPT, Claude, or another agent;
what this repo binds is the *output* (verified, deterministic,
renders offline on the user's PC).

## The niche

One profession per video, 60 seconds, 9:16. Second person,
present tense: the viewer *is* the worker. The narration follows
a fixed structure — a one-sentence paradox hook ("You build a
piece of metal that has to disappear in a photograph."), concrete
physical detail, a problem whose fix creates a new problem, a
"Wait, why..." question that flips the viewpoint, a "You see,"
rule reveal, a physical solution verified through the lens, and
a cold close with no call to action. NOT strictly POV camera —
third-person / mixed camera is allowed.

## How to use this repo (as context for an AI agent)

1. Give the agent `SKILL.md` first. It is the whole workflow:
   narration rules, audio, SRT, scene code, verification,
   packaging, render, and SFX.
2. `prompts/` holds the stage-1 (narration) and stage-2 (scene
   code) prompts plus the format spec for the writing agent.
3. `reference/` holds the proven reference implementation: the
   animation bridge and the fry cook 60 s video files.
4. `sfx/` holds the earshot SFX palette (27 sounds) + mixer.
5. `examples/` holds two narration examples that follow the
   tone: museum mount maker and foley artist.

## The workflow in brief (7 steps)

1. Pick topic, duration, style. Agree the slug.
2. Write the narration (stage-1): 13 lines, ~175–190 words
   for 60 s, one sentence per line.
3. Generate the full narration audio at once (Google AI Studio
   Gemini TTS, or built-in Muse TTS). One file, never per-line
   unless asked.
4. Transcribe the audio → SRT; cross-check with Whisper
   word-level alignment.
5. Write the scene code (stage-2): 4 files + Root.tsx block +
   SRT.
6. Verify: tsc, stills QC, Whisper cross-check. Fix what fails;
   never ship unverified.
7. Package + render locally on the PC. Upload the mp4 back.

## The one hard requirement

Rendering on the user's PC must **NOT download anything**: no
portable Node, no `npm ci` / dependencies, no browser/Chromium.
The PC already has Node v26, shared node_modules, and an
existing headless browser. The user's internet is slow — a first
render that downloads hundreds of MB is the biggest practical
problem. See `SKILL.md` → "Packaging".

## Directory map

```
SKILL.md            the skill (start here)
LICENSE             MIT
prompts/            stage-1 + stage-2 prompts, format spec, README
  README.md
  stage-1-narration-prompt.md
  stage-2-scene-prompt.md
  chatgpt-format-spec.md
reference/          proven reference implementation (from-scratch snapshot)
  package.json
  src/Root.tsx
  src/compositions/bridge/     animation bridge (13 files, verbatim)
  src/compositions/frycook/    fry cook 60 s (Story/Cast/World + .tsx)
sfx/                earshot SFX palette (27 sounds, 24 kHz mono)
  README.md
  PALETTE.md
  mix_sfx.py
  24k/*.wav
examples/           narration examples in the house tone
  museum-mount-maker-narration.md
  foley-artist-narration.md
```

## Credits

- Animation bridge: [mromidev/claude-animated-shorts](https://github.com/mromidev/claude-animated-shorts)
  (MIT). The `reference/src/compositions/bridge/` files are copied
  verbatim from its `templates/bridge/`.
- SFX generator: [Leonxlnx/earshot](https://github.com/Leonxlnx/earshot)
  (v1.0.0). The `sfx/` palette was rendered from the earshot bank.
- This repo's own work (skill, prompts, reference video files,
  narration examples) is MIT — see `LICENSE`.

## Status

Proven: fry cook 60 s (Whisper-verified narration + karaoke),
museum mount maker 67 s. Long (16:9) mromidev has no builder yet.
