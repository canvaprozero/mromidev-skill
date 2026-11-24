# Animation, QC, and offline render

## Lock the cast before shot production

Start from `bodyFront` and `bodySide` in
[`toon.ts`](../reference/src/compositions/bridge/toon.ts) and the billboard
placement and texture pool in [`cast.ts`](../reference/src/compositions/bridge/cast.ts).
Keep a model sheet with
front, side, 3/4, full-body and close-up poses. Approve the silhouette, proportions,
line weight, wardrobe, colors, and the key props for each recurring actor. Use
one cast definition per character. Change viewpoint, pose, expression, and
lighting through the rig.

- Attach hands and sleeves through the shoulder–elbow–wrist chain, and shoes
  through hip–knee–ankle. Use local joint transforms and keep the same attachment
  points across views. Drive gait from the root and keep planted feet fixed in
  world space until lift-off.
- Use the same posed actor for close-ups, silhouettes, and monitor shots. Crop
  with the camera. Place desks, doors, and chairs in 3D so occlusion and floor
  contacts stay coherent when the camera moves. For an eight-second monitor offset,
  evaluate the same timeline with a deliberate frame offset.
- Attach held props to a hand or contact socket. On release or hand-off, preserve
  the prop's world transform at the transfer frame and then animate it from its
  new parent. Check the frame before, during, and after the transfer.
- Establish real depth in the set with a visible floor plane, a back wall, and
  one separated foreground or midground object. Use a slightly angled camera.
  In tight detail shots, let the established set guide placement and perspective.
  Use camera motion to clarify depth, action, or a reveal. Keep the payoff object
  and the character's reaction readable on a phone.

## Render deterministically

Derive animation state from the frame, fps, and seeded inputs. Keep playback and
render order independent. Preload fonts and local media once per renderer, and
release any `delayRender` handle as soon as the asset is ready. Call
`cancelRender` on a load failure so the frame's log points to the actual asset.
Keep canvas drawing synchronous during frame rendering. Reuse geometry, textures,
and postprocessing buffers across frames within a renderer.

For a stationary backdrop, composite static geometry into one reusable buffer
and apply blur once per shot, camera, and output size. Keep moving layers separate.
For a moving camera or changing light, recalculate only what its change requires.
Avoid a new full-resolution offscreen surface or blur pass for each object.

## QC gates

| When | Inspect | Pass condition |
| --- | --- | --- |
| Before all shots | Cast sheet and a low-cost motion test with a walk, reach, and sit or representative actions | Consistent anatomy at every angle, planted feet, and clean prop contacts |
| After blocking | Timed low-resolution preview with voice and sound | Viewer follows intent, action, and consequence on first play; frames allow time to see the evidence |
| Before full render | First, middle, and last frame per shot; clips spanning difficult transitions, motions, occlusion, and effects | Limbs and clothes stay attached, feet and seat make contact, props stay aligned, captions follow audio, and there is no title overlay |
| Render preflight | Native Remotion at 1080×1920 over effect-heavy shots, cuts, and known failure frames | Same composition and local assets as final; no timeouts, blank frames, missing textures, or capture artifacts |
| Delivery | Watch the final MP4 with sound and check metadata | 1080×1920, 30 fps, expected frames and audio, H.264/yuv420p, faststart, acceptable sync and intelligibility |

For each failure, record the shot, frame or time range, cause, and retest
result. A changed shot gets its neighboring cuts, caption timing, and sound
cues rechecked. Keep inexpensive previews for iteration. Test risky effects at
full resolution before spending time on a complete render.

## Package and run

Supply `src/index.ts` and the registered composition, required dependencies
and fonts, `public/` assets, mix and alignment, and a copy of
[`render.cjs`](../scripts/render.cjs) at the project root. Pass the composition
ID as registered. Use the existing Node (20+), shared Motion dependencies,
and preinstalled Chromium headless shell. The launcher uses single-worker
software encoding and disables shared-memory capture.

The reference uses Remotion 4.0.540 and three.js 0.187.0. Keep the installed
Remotion CLI and runtime versions aligned with the episode package. Changing
either version or renderer requires a fresh target-resolution spike.

```sh
node render.cjs --check
node render.cjs EpisodeMromidev qc-heavy-shot.mp4 --frames=820-860
node render.cjs EpisodeMromidev Episode.mp4
```

The range is an inclusive example around the mural timeout. Choose ranges from
the current episode sheet. Add `--gl=angle` or `--gl=swangle` if a known WebGL
setup needs an explicit backend. On Windows the launcher checks the parent
`node_modules` and `%USERPROFILE%\Videos\Motion\node_modules`.
If the paths differ, set `MOTION_NODE_MODULES` and
`REMOTION_BROWSER_EXECUTABLE` before running. Use a local file path for every
font, image, and audio asset. Library extras such as Kenney models must be
included locally if the scene needs them.

When a render stalls, rerender a short range around the first reported frame.
Inspect asset readiness and delay handles, failed file requests, font loading,
and the renderer's memory and draw work around the cut. Profile the frame before
raising the timeout. Existing heavy Canvas frames can benefit from compositing a
static background once instead of applying a blur per object.

Measure the final container and verify `moov` precedes `mdat`.

```sh
ffprobe -v error -show_streams -show_format -of json Episode.mp4
```

`ffprobe` may report full-range 4:2:0 as `yuvj420p`. Check the decoded picture
as well as the format tags. Record which machine performed the render. A
workspace preflight and a local PC render are separate evidence.
