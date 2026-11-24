---
name: mromidev-production
description: Plan, animate, mix, verify, and package English-language Mromidev 3D Shorts for offline Remotion rendering. Use for new episodes, shot revisions, and render troubleshooting.
---

# Mromidev 3D production

Build 9:16 Shorts for an international audience. The visual baseline is a 2D toon
cast grounded in a real 3D set, using Remotion and three.js. Choose the story
format to fit the premise. The profession examples remain useful for that series.
Use English for spoken narration and captions, and keep the video title in metadata.

## 1. Lock the story

Use [the narration guide](workflow/narration.md) and [stage 1](prompts/stage-1-narration-prompt.md).
Start the episode sheet with three sections.

1. **Pertanyaan awal** — one specific question the opening image and narration make
   the viewer want answered.
2. **Yang bikin penonton bertahan** — visible beats that add evidence, escalate the
   stakes, or force a choice. Show a new rule clearly once before raising the stakes.
3. **Payoff** — an observable answer to the opening question and its consequence.
   If there is a twist, plant the clue that lets viewers reinterpret earlier action.

Read the draft aloud. A listener should be able to say who wants what, what
changed, and what the last action proved. Revise the story before recording if
those answers are unclear.

## 2. Lock the audio and board the shots

Record or generate one editable take, with expression directions suited to the
chosen voice tool. Compare the actual take against the approved script. Use
Whisper word alignment as a starting point and correct names, omissions, and
offsets against the audio. Derive SRT, karaoke, and shot timing from the aligned
take on the final timeline, including any leading offset or edits.

Follow [stage 2](prompts/stage-2-scene-prompt.md) and fill out the
[episode sheet](workflow/episode-sheet.md). Assign each shot a story beat, frame
range, camera, cast action, and visual evidence. Plan beds and cue anchors while
boarding and render them from the original [Earshot source](sfx/README.md).

## 3. Build the scene and mix

Use the bundled [bridge](reference/src/compositions/bridge/) as the visual
reference. Start with its `toon.ts` character proportions and front/side
silhouettes. Lock the cast and verify poses before building all shots. Follow
[the animation and QC guide](workflow/animation-qc.md) for rig hierarchy, contacts,
screen inserts, frame determinism, composition, and render performance.
Prove the depth of the main set with a short camera and motion test before
building the remaining shots. Use the test to establish how the camera, cast,
and props move through the same space.

Register an exact-duration composition at 1080×1920, 30 fps. Set captions from
aligned words, one at a time, Poppins Bold 700, amber `#FFD84D` with a dark outline.
Use the reference 64 px size and 288 px bottom margin as a starting point.
Keep words legible and clear of the subject. Respect speech gaps. Include the font
locally. Render karaoke and story-required in-world text only.

Keep narration, effects, ambience or music stems, and the final stereo mix.
Reference the final mix as a local asset in the Remotion composition. Preserve
voice clarity and use the shot action to time cues, with room for the payoff.

## 4. Verify and deliver

Check types, review shot anchors and in-motion excerpts, and render the most
expensive range at target resolution with the intended offline setup before
handing off. Use the gates in [animation and QC](workflow/animation-qc.md).
When reviewing a revision, include neighboring cuts and cues. Use the episode
sheet to record actual ranges, evidence, fixes, and any unverified item.
Check moving props over their full travel against nearby geometry in its local
coordinates. When the edit permits a range render, verify the patched MP4 at
both joins.

Package scene and registration files, local assets (including the mix, font,
and captions), dependency versions, the [offline launcher](scripts/render.cjs),
and render instructions. The render runs on the user's PC with its existing Node,
Remotion dependencies, and browser. For the Windows RTX 2060 Super workflow,
verify the WebGL adapter and NVENC encoder separately in a short render before
launching the full GPU export. After the full render, verify the actual MP4 and
watch it with sound before marking the release ready.

Reference snapshots in `reference/` show visual and code patterns. Episode
packages include their own runnable entry point, fonts, audio, and assets.
