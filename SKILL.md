# Mromidev 3D — "How It Feels to Be a [Profession]"

Use this skill whenever a video is requested in the `mromidev` style
("Mromidev 3D"): 2D billboard cartoon characters in a 3D toon world,
built with Remotion + three.js, for the niche "how it feels to be a
[profession]". The workflow below is agent-agnostic: it was built with
ChatGPT (Sol) writing narration + scene code and Muse verifying +
packaging, but any capable agent can play either role — the roles, not
the brand, are what matter. This skill is written so it can be handed
to another AI agent as context.

## When this style applies

- The job's `visual_style` is `mromidev`. 9:16 Shorts (60 s) is
  proven; 16:9 Long has no builder yet — a Long mromidev job sits
  pending.
- The niche: "how it feels to be a [profession]". NOT strictly POV
  camera — third-person / mixed camera is allowed.
- The look: mromidev 2D billboard cartoon characters in a 3D toon
  world. Source: `mromidev/claude-animated-shorts` (MIT),
  `templates/bridge/` copied verbatim into
  `src/compositions/bridge/`. All geometry hand-coded; no
  downloaded models.
- Renders are CPU-heavy (three.js/WebGL): Hatch CPU ~4 s/frame at
  dpr 0.5 (60 s ≈ 2 h), and WebGL fails on the Oracle ARM VPS — so
  render locally on the user's PC (i5-9400F, RTX 2060 Super, Node
  v26) or accept the Hatch time. Never render three.js on the VPS.

## End-to-end workflow (7 steps)

1. Pick topic, duration, style. Agree the slug (file names use it).
2. Write the narration (stage-1) — see "Narration". 13 lines,
   ~175–190 words for 60 s.
3. Generate the full narration audio at once in Google AI Studio
   (Gemini 3.8 Flash TTS) — or built-in Muse TTS (see "Audio").
   One file, full narration, never per-line unless the user asks.
4. Transcribe the audio → SRT (per-line timings). The writer's SRT
   is the primary path; the verifier cross-checks it with Whisper
   word-level alignment.
5. Write the scene code (stage-2) — 4 files + Root.tsx block + SRT.
   See "Scene code".
6. Verify (see "Verification"): tsc, stills QC, Whisper
   cross-check. Fix what fails; never ship unverified.
7. Package + render locally on the PC (see "Packaging" and
   "Render"). Upload the mp4 back in the job card.

## Narration (the tone — non-negotiable)

Second person, present tense, short concrete sentences. Structure,
in order:

1. Hook = a one-sentence paradox (the work that has to disappear:
   "You build a piece of metal that has to disappear in a
   photograph.").
2. Concrete physical details + senses, never abstract explanation
   ("the foot tap twice", "shines like a little silver tooth",
   "the chip in the lip, the clay rings, and the shadow beneath
   it").
3. A visible problem, then a fix that creates a new problem
   ("The vase holds, but the wedge sticks out.").
4. A mid-scene dialogue call ("Can we get the photo now?").
5. The question "Wait, why..." that flips the viewpoint ("Wait,
   why does the same support disappear from one angle and jump out
   from another?").
6. "You see," + the rule reveal — the rule that explains the hook
   ("You see, the vase is wider halfway up. From the front, that
   curve hides whatever sits behind it.").
7. A physical solution, then verification through the lens/phone
   ("Then you check through the phone again...").
8. Cold close, no CTA — what was made is the thing missing from
   the photo ("From back here, you can see every hour of work the
   photo leaves out.").

13 lines, 175–190 words for 60 s, one sentence per line. (TTS
hallucination rule: one long single-line paragraph hallucinates —
one sentence per line.) Reference narrations in `examples/`: `museum-mount-maker-narration.md`
(museum mount maker, B revision) and `foley-artist-narration.md`
(assistant-written foley artist demo).

## Audio

- Google AI Studio: `https://aistudio.google.com/generate-speech`,
  model `gemini-3.8-flash-tts`. Expression tags are INLINE ANGLE
  BRACKETS: `<laugh>`, `<gasp>`, `<sigh>`, `<chuckle>`,
  `<breath>`, `<short pause>`, `<long pause>`. Style direction goes
  in the separate style field. CAPS = stress, `...` = hesitation.
  The old 3.1 square-bracket `[tag]` syntax does NOT apply to 3.8
  — never mix them. Download the wav, one full file.
- Built-in Muse TTS (pipeline default): `/opt/hatch/bin/tts speak`,
  one call per narration line, then ffmpeg concat (24 kHz mono,
  libmp3lame 64k). Voice catalog: Melody default
  (`avocado_v2:melody`) + 9 voices incl. Sprightly Sprinkler
  (`avocado_v2:vd3_qvd_00052`). Samples live in the Motion Stock tools frontend (`frontend/voices/`
  + `en/`, not in this repo). ElevenLabs NOT used — 100% free rule.
- TTS hallucination check: duration ≈ words ÷ 2.5–3; if far off,
  check the Whisper transcript before rendering.
- Verify every voice with Whisper: all words present, in order,
  no hallucination. Fry cook: 176/176. Museum Sprightly trial:
  173/173 (only digit/apostrophe formatting diffs).

## SRT

- Primary: transcribe the audio (same chat/agent that wrote the
  code). Requires: narration starts exactly at video start, audio
  used whole; include the original script so names/terms are
  spelled right; if there is an intro/pauses/cuts, send the final
  video too.
- The verifier cross-checks with Whisper word-level alignment and
  corrects timings that drift. Writer timestamps are per-segment
  estimates — never the source of truth for animation cut timing.
- Karaoke word timings come from Whisper, never invented.

## Scene code

- Deliverable: `src/compositions/<SLUG>/<slug>Story.ts`,
  `<slug>Cast.ts`, `<slug>World.ts`, `<Slug>.tsx` (full files) +
  `src/Root.tsx` registration block (new `<Composition>` id
  `"<Slug>Mromidev"`, `durationInFrames={TOTAL}`, fps 30,
  1080×1920) + SRT. OR a complete standalone render zip (scene
  files + bridge + package.json + render script + audio). Either
  is fine — what matters is the result.
- Bridge: `templates/bridge/` (11 files) copied verbatim; only
  the 2 files nothing imports may be absent. Package versions:
  Remotion 4.0.540, three 0.187.0.
- Determinism: seeded PRNG (mulberry32). Forbidden:
  `Math.random`, `Date.now`, `requestAnimationFrame`,
  `setInterval`, CSS keyframes/SMIL. Same frame = same pixels.
- Composition: first AND last frame of every shot must each stand
  alone as a good composition. No element may cover the main
  character's face. One consistent colour palette (one warm base
  + one accent).
- Camera: pan / pull-back and slow push-ins (gentle drift, zoom
  ±2–3% per scene). No hand-held float, no impact kicks except
  for a genuine impact beat.
- Captions: ONE title caption (video title, Poppins 700, y=1640)
  + word-by-word karaoke (REQUIRED). Karaoke: one word at a time,
  centre, Poppins Bold 700 amber `#FFD84D` + dark outline, 230 ms
  pop, raw Whisper window (no +0.3), fontSize 64, bottom 288,
  above the title with a gap (karaoke ~y1568–1632, title at y1640
  — never overlap, never cover the main character's face).
  Implement inline OR via the frozen `design/Karaoke` component
  reading `getInputProps().karaoke`
  (`{words: [{word, start, end}], size}`) — either is fine. No
  subtitles or per-line captions.
- Fonts: `src/fonts.css` (Poppins, Bebas Neue, Oswald, Patrick
  Hand) — include it and import it. Never write `@font-face`,
  never rely on system fonts.
- Character lock: main character present → design locked across
  all scenes (drift = regenerate); other characters/crowds vary
  per beat; no main character → no lock.

## Verification (the Muse workflow — verify before claiming)

- tsc: 0 errors in touched files (pre-existing errors elsewhere
  are not yours to fix, but say so).
- Stills QC: one frame per shot (dpr 0.5) + one frame at dpr 1.0.
  Check: composition, no overlap, karaoke shows the right word at
  the right time, silence/gaps have no stray word, title never
  collides with karaoke.
- Whisper cross-check of SRT/karaoke against the actual audio
  (see "SRT").
- ffprobe: duration, fps, resolution; mp4 must be faststart
  (moov before mdat).
- Report file sizes + md5s from the actual files, never from a
  worker's claim. A revision counts as done only after
  verification passes.

## Packaging

- The render package is built by the verifier (assistant), or by
  the writer as a standalone zip — either is fine.
- THE ONE HARD REQUIREMENT: rendering on the user's PC must NOT
  download anything. No portable Node, no `npm ci` /
  dependencies, no browser/Chromium. The PC already has Node v26
  (use PATH, major ≥ 20), shared node_modules at
  `C:\Users\Cloudy\Videos\Motion\node_modules` (use it; install
  only if that folder is missing), and an existing headless
  browser (find it first; download only as a last resort). The
  user's internet is slow — a first render that downloads
  hundreds of MB is the biggest practical problem.
- Render at dpr 1.0. Merge narration audio automatically. Output
  mp4 must be faststart.
- Reference packager: render.bat v6 (Windows) / render.command
  (Mac) — installed-Node check, shared node_modules,
  existing-browser detection (`--browser-executable`), GPU
  `--gl=angle` first with `--gl=swiftshader` fallback, ffmpeg
  faststart copy pass.

## Render (local, on the user's PC)

- Windows: extract the zip under `C:\Users\Cloudy\Videos\Motion\`,
  run render.bat. Mac: run render.command (default OFFLINE;
  `--online` only for one-time setup; Mac node_modules at
  `~/Movies/Motion/node_modules`).
- Mac lesson (2026-11-23, Museum Mount Maker B): a Mac render
  split frames into ~5 horizontal bands. Cause: three Mac-only
  mechanisms in the renderer — full Google Chrome
  `--headless=new` (not chrome-headless-shell), VideoToolbox
  hardware encode tried first, and Remotion shared-memory capture
  (auto-active only on Apple Silicon macOS 15+). The fix: always
  chrome-headless-shell, `disableSharedMemoryCapture: true`, no
  hardware encode (x264 crf 17 like Windows). Silent corruption
  (no error) means fallbacks never trigger — remove the
  mechanisms, don't rely on catching errors. Fallback if banding
  recurs: `concurrency: 1` (render ~2x slower).
- Progress: a single tidy progress line (bar + %, updating in
  place; one line per 5% if piped). Detail logs only with
  `--verbose`.

## SFX

- SFX only when the picture cannot say it (atmosphere/wind,
  transition/whoosh, reveal/pop, closing/chime). NEVER literal
  body sounds (breath, steps, eating) — narration already conveys
  them.
- Design cues as `[{file, at, vol}]` from `sfx/` in this repo
  (27 earshot sounds, 24k mono; mix with `sfx/mix_sfx.py`;
  see `sfx/README.md` and `sfx/PALETTE.md`). Rotate variants
  within a family; never the same file twice in a row.

## Reference implementations + key files (all in this repo unless noted)

- Fry cook 60 s (proven):
  `reference/src/compositions/frycook/`
  (fryStory/fryCast/fryWorld + FryCook.tsx), `reference/src/Root.tsx`
  FryCookMromidev 1800 frames, karaoke via props.karaoke
  (176 words, Whisper-verified). Bridge:
  `reference/src/compositions/bridge/` (13 files, verbatim).
- Museum Mount Maker 67 s (B version): narration example in
  `examples/museum-mount-maker-narration.md` (13 lines, 62.88 s
  audio); SFX from earshot (see `sfx/README.md`).
- From-scratch package (prompts + format spec): `prompts/`
  (README.md, stage-1-narration-prompt.md,
  stage-2-scene-prompt.md, chatgpt-format-spec.md).
- Narration demo (assistant-written, foley artist):
  `examples/foley-artist-narration.md`.
- Voice catalog: Motion Stock tools frontend `frontend/voices/`
  (+ `en/`, not in this repo), Melody default.
- Runbook (not in this repo): Motion Stock `MOTION_RUNBOOK.md` §13
  (narration workflow) + §12 (Claude jobs).

## What this skill does not cover

- It does not change the daily Shorts path, the stickman /
  illustrated builders, or the narration workflow for
  non-mromidev jobs.
- It does not authorize re-rendering finished videos. Fixes to a
  finished video go through the revision flow, never a full
  rebuild.
- It does not pick the writer: ChatGPT, Claude, or the assistant
  may write narration + scene code — the skill binds the OUTPUT
  (verified, deterministic, no-download render), not the brand on
  the account.
