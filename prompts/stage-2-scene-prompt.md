# Stage 2 — prompt kode animasi (paste ke ChatGPT)

**Cara pakai:** pakai di chat ChatGPT yang SAMA dengan tahap 1, setelah
narasi disetujui dan mp3 di-generate. Upload mp3 narasi (+ script yang
sudah disetujui) ke chat itu, isi placeholder `[TOPIK]`, `[SLUG]`,
`[DURASI]` di dalam prompt di bawah, paste seluruh blok `text`, dan
paste naskah narasi di bagian "NARRATION SCRIPT" di akhir prompt.
ChatGPT akan mentranskrip mp3 menjadi SRT dulu, lalu menulis kode
animasinya dari SRT itu.

**Nama file scene baru:** file scene memakai slug topik
(`src/compositions/<slug>/`) dengan pola yang sama seperti referensi
fry cook (`fryStory.ts` / `fryCast.ts` / `fryWorld.ts` / `FryCook.tsx`).
Contoh: topik "night-shift nurse", slug `nurse` →
`nurseStory.ts`, `nurseCast.ts`, `nurseWorld.ts`, `Nurse.tsx`,
composition id `NurseMromidev`.

```text
You are building a Remotion + three.js animated short in the "mromidev
cartoon 3D" style. The project is in the uploaded ZIP. Read the reference
scene first: src/compositions/frycook/ is the COMPLETE 60 s reference
implementation (fryStory.ts, fryCast.ts, fryWorld.ts, FryCook.tsx) — same
engine, same camera grammar, same post chain. Read the skills summary in
this prompt (section "SKILLS") and the bridge engine in
src/compositions/bridge/ (13 files — do not rewrite them).

PROJECT FACTS: Remotion 4.0.540, React 18.3.1, three 0.187.0,
@react-three/fiber 8.18.0, @react-three/postprocessing 2.19.1,
postprocessing 6.39.6, TypeScript 5.4.5. Canvas 1080x1920, 30 fps.
Rendered WITHOUT audio (the mp3 is muxed onto the video separately, never
embedded in the code).

NEW VIDEO:
- TOPIC: [TOPIK — same as stage 1, e.g. "how it feels to be a night-shift nurse"]
- SLUG: [SLUG — short lowercase id for the new scene, e.g. "nurse", "barista", "linecook"]
- DURATION: [DURASI in seconds — same as stage 1; TOTAL frames = DURATION x 30]
- STYLE: mromidev cartoon 3D (same as the fry cook reference)

STEP 1 — TRANSCRIBE THE AUDIO AND BUILD THE SRT (do this first, before
any code):
1. I have uploaded the narration audio file (mp3 or wav) to this chat,
   and pasted the approved script below (section "NARRATION SCRIPT").
   Transcribe the audio and build an SRT with one entry per script line,
   timestamps per sentence.
2. Use the pasted script to spell names and special terms correctly — the
   script is the ground truth for the WORDS; the mp3 is the ground truth
   for the TIMINGS. The <...> tags in the script are vocal events (laughs,
   gasps, pauses), not spoken words — ignore them when matching words, but
   note where they fall, because they take time in the audio.
3. Assumption: the narration starts exactly at 0:00 and the audio is used
   whole (no intro, no extra pauses, no cuts), so the SRT starts at
   00:00:00,000. The last ~4–5 seconds are a silent closing hold after the
   final line. If the transcription shows an intro, long leading silence,
   or cuts, SAY SO before writing any code — do not guess the timings.
4. If the audio file is missing from this chat, use the SRT pasted in section
   "SRT (only if no mp3 was uploaded)" instead — do not estimate timings
   from the text alone.
5. Show the SRT as a table (line #, start s, end s, frames, line text)
   before writing any code. Frame = seconds x 30.

STEP 2 — WRITE THE SCENE CODE, driven by that SRT:

HARD RULES — do not break any of these:
1. Build a NEW scene for the new topic in src/compositions/<SLUG>/ — do
   NOT modify the fry cook files (they are the reference only). New files,
   modeled on the fry cook reference:
   - src/compositions/<SLUG>/<slug>Story.ts (timeline, shots, cameras, DOF)
   - src/compositions/<SLUG>/<slug>Cast.ts (billboard character, outfit, staging)
   - src/compositions/<SLUG>/<slug>World.ts (procedural 3D world)
   - src/compositions/<SLUG>/<Slug>.tsx (component + post chain + title caption)
   Follow the fry cook files' structure and naming — same exports (FPS,
   TOTAL, SHOTS, shotAt, layersAt, camAt, dofAt, focusAt, per-prop
   timelines), adapted to the new world.
2. Shots follow the narration beats and the SRT timings from Step 1. One
   idea per shot; a shot lasts roughly one narration line (3–6 s). Shot
   boundaries land on narration line boundaries, never mid-sentence.
   TOTAL = DURATION x 30; the last ~4–5 s (after the final line) are a
   silent closing hold.
3. Follow the mromidev conventions in the SKILLS section below: story
   schema (SHOTS / XFADE / CAMS / KICKS / DOF / FOREGROUND), camera grammar
   (smootherstep glides 18–40 f, holds creep 0.15–0.35 %/f, rolls 4–5 deg,
   hard cuts for big reframes), billboard characters via the Pen API, and
   the post chain. Copy the existing patterns in the fry cook files — do
   not invent a new architecture.
4. Build a NEW world and character for the topic: the character (outfit,
   colours) and the world (room, props, layout) must fit the
   profession/topic. All new geometry must be procedural (three.js
   primitives + painted canvas textures, like the existing code). NO Kenney
   GLB props — public/bridge/kenney/ is empty and the loader falls back
   gracefully, so do not reference any GLB. NO trademarked logos, NO brand
   names, NO real company names in the visuals.
5. NO new dependencies. NO external assets, NO CDN, NO downloaded models or
   images, NO audio in the code (the narration mp3 is muxed separately).
6. Deterministic, pure function of frame: use useCurrentFrame() only. NO
   Math.random (use the mulberry32 seeded PRNG already in fryWorld.ts), NO
   Date.now, NO requestAnimationFrame, NO setInterval, NO CSS keyframes/SMIL.
   The same frame must always render the same pixels.
7. Captions: ONE title caption — the video title (e.g. "how it feels
   to be a night-shift nurse"), Poppins 700, y=1640, same placement/style
   as FryCook.tsx — PLUS word-by-word karaoke. Karaoke is REQUIRED: one
   word at a time, centre, highlighting the word being spoken. You may
   implement it inline in the component (timings derived from the SRT
   line timings) OR via the frozen design/Karaoke component
   (`../../design/Karaoke`) reading `getInputProps().karaoke` (object
   `{words: [{word, start, end}], size}`) — either is fine. Use fontSize
   64, bottom 288, placed above the title caption with a gap (karaoke
   ~y1568-1632, title at y1640 — they must never overlap, and neither
   may cover the main character's face). Do NOT add subtitles or per-line
   captions. Note: the assistant verifies the per-word timings against
   the actual audio with Whisper when the code comes back and corrects
   them if they drift — derive them as accurately as you can from the
   SRT.
8. First AND last frame of every shot must each stand alone as a good
   composition (no deliberately wide/empty starts to make zoom room). No
   element may cover the main character's face. Keep one consistent colour
   palette for the scene (one warm base + one accent colour, like the fry
   cook's warm cream + teal).
9. Register the new composition in src/Root.tsx: a NEW <Composition> block,
   id "<Slug>Mromidev", component <Slug>, durationInFrames={TOTAL}, fps 30,
   width 1080, height 1920. Do NOT change any other composition's
   registration. (Note: the CLI rejects a frame range outside
   durationInFrames, so the registration must declare the full TOTAL.)
10. Camera language: pan / pull-back and slow push-ins (gentle drift,
    zoom ±2–3% per scene, pan/pull-back on emphasis). No hand-held float,
    no impact kicks except for a genuine impact beat.

OUTPUT FORMAT: return the COMPLETE files in full, one fenced code block
per file, each block headed with its project path. Files to return:
- src/compositions/<SLUG>/<slug>Story.ts (full)
- src/compositions/<SLUG>/<slug>Cast.ts (full)
- src/compositions/<SLUG>/<slug>World.ts (full)
- src/compositions/<SLUG>/<Slug>.tsx (full)
- src/Root.tsx — only the new composition registration block (full block).
Do NOT return diffs or patches. After the code, give a shot list: shot id,
frame range, which narration line(s) it covers, and one line describing
the framing.

PACKAGE FORMAT — what you return:
- You may return EITHER (a) the 4 scene files above + the Root.tsx
  registration block + the SRT (Step 1 table) — the assistant builds
  the render package; OR (b) a complete standalone render zip like
  Museum Mount Maker (scene files + bridge + package.json + render
  script + audio). Either is fine — what matters is the result.
- THE ONE HARD REQUIREMENT: rendering on the user's Windows PC must
  NOT download anything. No portable Node, no `npm ci` / dependencies,
  no browser/Chromium. The PC already has Node v26.13.1 (use PATH,
  major ≥ 20), shared node_modules at
  `C:\Users\Cloudy\Videos\Motion\node_modules` (use it; install only
  if that folder is missing), and an existing headless browser (find
  it first and use it; download only as a last resort). The user's
  internet is slow — a first render that downloads hundreds of MB is
  the biggest practical problem.
- Fonts: use src/fonts.css, supplied by the assistant — include it in
  the zip (if you build one) and import it, so karaoke and titles
  render in Poppins Bold, not Arial. Do not rely on system fonts.
- The output mp4 must be faststart (moov atom first), so it plays
  when attached in chat.

SKILLS — mromidev conventions the new code must follow
Source: mromidev/claude-animated-shorts (MIT), templates/bridge/ copied
verbatim into src/compositions/bridge/; the fry cook scene
(src/compositions/frycook/) is the complete reference implementation of
this engine. Only the conventions below bind the new code.

Script formula (already fixed — do not rewrite the narration): Hook =
paradox stated as fact, sentence 1, ~10–16 words → setting 1–2 lines,
present tense → escalation 3–6 beats with short in-character dialogue →
mystery beat ("Wait, …?") → pivot "You see," → real mechanism via an
everyday analogy → ironic payoff in the last 1–2 sentences. Second-person
"Imagine you're…" mode (this video uses it).

Story schema (bridge/story.ts, adapted in fryStory.ts): SHOTS {id, a, b}
— contiguous frame ranges, no gaps; shotAt(f); layersAt(f) returns
[{id, alpha}] (the fry cook uses hard cuts only: one layer, alpha 1).
XFADE optional {[shotId]: frames}. FLASH_AT optional white 4-frame flash
after the hook. CAMS: Record<shotId, Key[]> — Key {f, dur?, cut?,
s: (f) => Shot}; run() blends keys with glide(). KICKS:
[timeInSeconds, gain][] — impact kicks, offset flips sign every frame
(~3 px at 720p per unit), decays over 7 frames, roll ±0.23° per unit;
only for genuine impact beats. DOF: {f, dur?, cInf, focus?}[] — thin-lens
DOF, cInf = blur-disc radius px at 1080x1920 for infinity (0 =
everything sharp); on in ~1/3 of shots, wide shots stay sharp.
FOREGROUND: {a, b, kit, pos, s?, yaw?}[] — near framing objects at
0.3–0.5x focus distance covering 10–25% of one frame edge, never a face;
Kenney GLB kits NOT available — any foreground object must be built
procedurally.

Camera grammar: every move is a symmetric smootherstep glide of 18–40
frames (glide(u) = u^3(u(6u-15)+10), attack = release); holds push in
0.15–0.35 %/f (pushK — Math.exp(-rate * max(0, f - f0))); ~0.6 %/f for
~35 f on punch words; rolls 4–5° over ≥18 f on emphasis beats; held tilt
≤ 0.07 rad. A reframe bigger than ~half a frame width or 40% zoom is a
HARD CUT on its key frame (cut: true), never a glide. No hand-held float.

Characters — 2D billboards, NOT rigged 3D (bridge/toon.ts,
bridge/cast.ts): flat 2D cartoons drawn with the Pen API (Canvas2D) onto
a camera-facing card (billboard) in the 3D world. bodyFront(pen, outfit,
FrontOpts) — FrontOpts: phase, expr, mode "march"|"stroll"|"stand"|
"sit"|"fall", look, blink, lift, prop, tilt, headTilt, wave, light,
facing -1|0|1, seed. bodySide(pen, outfit, SideOpts) — SideOpts: phase,
expr, mode "march"|"stand"|"swing"|"push", blink, stomp, pose (0–1),
stride, light, seed, hand [x, y]. Outfit: {jacket, pants, boots, hat,
cap?, skin, belt?, buttons?, hair?, build? "adult"|"stout"|"kid", dress?,
rifle?, sword?, moustache?}. The fry cook: {jacket "#2f7d6e", pants
"#3b3f52", boots "#4a3426", hat "cap", cap "#2f7d6e", skin "#e8b98a"}.
Expr: "neutral"|"stern"|"grin"|"laugh"|"whistle"|"nervous"|"shock"|
"relief"|"relief_open"|"dazed" (the fry cook also uses "smile").
Deterministic blink: 4-frame blink every ~3.2 s ((f + seed*13) % 97 < 4).
Drawing resolution tiered by camera distance (tier(d): <3.2 m →
1800x3000, <6.5 m → 1080x1800, <16 m → 480x800, else 240x400).
Pool/Actor/Fx (bridge/cast.ts): billboard cards pooled and keyed (key
strings must change when the drawing changes); FX cards: fxPuff (steam),
fxContact, fxStars, fxRing, fxBurst, fxSplash. Sun direction is FIXED per
scene (the fry cook interior: front-right-top (0.45, 0.75, 0.55));
light2D(cam, mirror) converts it to a canvas angle in 45° steps.

World, materials, post chain (fryWorld.ts, FryCook.tsx, bridge/*): all
geometry procedural three.js primitives + painted canvas textures
(paint.ts: ctex(name, w, h, drawFn), beam()). Materials via lam() (cached
by key — new materials need unique <slug>_* keys) and twoTone() for
steel. Layout in metres, human scale (worker = template's 1.67 m adult).
Post chain (copied from the template's Bridge.tsx, wired in the
component): ink outlines → lens blur (pre + main, thin-lens, maxCoC 24)
→ bloom (emissive only, intensity 0.5, luminanceThreshold 1.0, MIP chain
anchored at 540x960) → NEUTRAL tone mapping → colour grade (GRADES.day)
→ optional grain (amount 0.025, seeded by frame — currently OFF). MSAA 4.
getInputProps().post toggles (ink/lens/pre/bloom/grade/grain/dpr) are for
test stills only. Render contract: pure renderAt(t) — useCurrentFrame()
only. Seeded mulberry32 PRNG only. No Math.random / Date.now /
requestAnimationFrame / setInterval / CSS keyframes / SMIL / CDN /
external resources / audio in the code. Grain seed = frame number.

QA rules: every frame checked for black / white / frozen / pop frames; a
frame must never be blank. First AND last frame of every scene must each
stand alone as a good composition. No captions unless asked (this video:
title caption only). Never upload / publish / send the template's
references/frames/ or references/sheets/ (study-only — not included in
this ZIP). Keep the MIT attribution comments crediting
mromidev/claude-animated-shorts.

NARRATION SCRIPT (approved, stage 1 output — paste here):
[PASTE THE APPROVED NARRATION LINES HERE, exactly as generated in AI
Studio, tags included]

SRT (only if no mp3 was uploaded):
[PASTE THE SRT HERE ONLY IF YOU DID NOT UPLOAD THE MP3 — otherwise leave
this section empty]
```
