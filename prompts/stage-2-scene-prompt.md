# Stage 2 — animation prompt

> Build the episode from the approved stage-1 outline, final spoken take with
> aligned words, and selected cast design. Use [SKILL.md](../SKILL.md),
> [animation and QC](../workflow/animation-qc.md), [Earshot](../sfx/README.md),
> and [the format spec](chatgpt-format-spec.md). Fill out the [episode
> sheet](../workflow/episode-sheet.md) as decisions are verified.
>
> Board each shot by frame range, visible story beat, action and contact, camera,
> and sound cue. Review the cast lock in full body and close-up, then preview
> a representative motion and a timed edit before finishing all the shots.
>
> For MeowExplain, use the [channel profile and cast
> reference](../profiles/meowexplain/README.md#character-lock). For other
> episodes, use the bridge `toon.ts` reference as the silhouette baseline. Animate
> attached limbs and props from the cast rig. Use the same pose source for
> monitor views and close-ups. Use real 3D room depth and consistent occlusion.
> Produce a short depth test that shows how the camera travels past a foreground
> object. Drive animation deterministically from Remotion frames.
>
> Package complete Story, Cast, World and composition files, entry point and
> registration, required bridge and scene assets, local fonts, aligned SRT and
> karaoke data, and the episode mix and source cue list. Register exact 1080×1920,
> 30 fps playback. Use English one-word karaoke. Keep title text in metadata.
>
> Record type-check results and motion QC over the full travel of close passes,
> including any tether or attachment. Render the risky ranges at target
> resolution with the included offline launcher. For the Windows GPU export,
> record the actual WebGL adapter and encoder separately. List the result and
> any remaining checks before the full local PC render.
