# Animation, QC, and offline render

[Depth and clearance](#prove-depth-and-check-clearance) · [QC gates](#qc-gates) · [Windows GPU preflight](#windows-gpu-preflight)

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

## Prove depth and check clearance

Make a representative 6–8 second shot before building out a depth-driven set.
Place the foreground, subject, and background at separate depths. A passing
rail or similar foreground object should move faster on screen and occlude
the subject briefly as the camera travels. Keep the action visible through the
move. Reuse the approved set and prop geometry for the related shots.

For close passes, check the whole movement from entry to exit, including the
turnarounds and closest approach. For a moving obstacle, evaluate the prop and
its tether in the obstacle's local coordinates with their world transforms.
Allow clearance for the full shape under rotation. A conservative bound is
enough when it leaves room for the intended motion. Sample subframes for narrow
clearances or fast motions. Review the same interval from the final camera for
visibility, contact and occlusion.

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
| Depth test | One representative camera move through the set | Parallax and occlusion show depth and the action stays readable |
| After blocking | Timed low-resolution preview with voice and sound | Viewer follows intent, action, and consequence on first play; frames allow time to see the evidence |
| Before full render | First, middle, and last frame per shot, plus contiguous motion checks around contacts, occlusion, and close passes | Limbs stay attached, feet make contact, props and tethers clear the set, captions follow audio, and the title stays in metadata |
| Render preflight | Native Remotion at 1080×1920 over effect-heavy shots, cuts, and known failure frames | Same composition and local assets as final. Check for timeouts and capture artifacts, and record separate evidence of the WebGL adapter and encoder. |
| Delivery | Watch the final MP4 with sound and check metadata | 1080×1920, 30 fps, expected frames and audio, H.264/yuv420p, faststart, acceptable sync and intelligibility |

For each failure, record the shot, frame or time range, cause, and retest
result. A changed shot gets its neighboring cuts, caption timing, and sound
cues rechecked. Keep inexpensive previews for iteration. Test risky effects at
full resolution before spending time on a complete render.

When a fix is confined to a frame range and the edit allows it, render the
affected range and patch the released MP4. Use matching video settings and
keyframe-safe boundaries for stream copying. Preserve the audio track if the
edit leaves it intact. Verify both joins in the exported file, including frame
cadence, total frame count, and audio and caption sync.

## Package and run

Supply `src/index.ts` and the registered composition, required dependencies
and fonts, `public/` assets, mix and alignment, and a copy of
[`render.cjs`](../scripts/render.cjs) at the project root. Pass the composition
ID as registered. Use the existing Node (20+), shared Motion dependencies,
and preinstalled Chromium headless shell. The launcher uses one render worker
and disables shared-memory capture.

The reference uses Remotion 4.0.540 and three.js 0.187.0. Keep the installed
Remotion CLI and runtime versions aligned with the episode package. Changing
either version or renderer requires a fresh target-resolution spike.

### Windows GPU preflight

For the RTX 2060 Super setup, run a representative range with desktop ANGLE
and required hardware encoding. Use the same options for the full GPU export
after both checks pass.

```sh
node render.cjs --check
node render.cjs EpisodeMromidev qc-gpu.mp4 --frames=750-840 --gl=angle --hardware-acceleration=required --log=verbose
node render.cjs EpisodeMromidev Episode.mp4 --gl=angle --hardware-acceleration=required --log=verbose
```

Choose the inclusive range from the episode sheet. The `--check` command
finds local dependencies and the browser. Record both results from the actual
render process.

- **WebGL.** Log the renderer from the composition's real WebGL context when
  creating it. Use the unmasked string from `WEBGL_debug_renderer_info` when
  available. If the browser masks the name, check the Chromium process on the
  NVIDIA GPU's 3D engine in Windows Task Manager. SwiftShader indicates
  software WebGL.

  ```ts
  const gl = renderer.getContext();
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  console.info('WebGL renderer:', gl.getParameter(info?.UNMASKED_RENDERER_WEBGL ?? gl.RENDERER));
  ```

- **H.264 encoding.** Check the verbose Remotion log for `h264_nvenc` and
  `hardware accelerated: true`, and confirm the test succeeds. The launcher
  uses a 12 Mbps bitrate in required hardware mode. Its default encoding mode
  is software H.264 at CRF 17.

If either GPU check fails, record which stage failed and report it before a
full GPU export. Use `--gl=swangle` for a software WebGL diagnostic range on a
GPU-less host. Identify the measured configuration in the results.

### Offline paths and export verification

On Windows the launcher checks the parent
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
