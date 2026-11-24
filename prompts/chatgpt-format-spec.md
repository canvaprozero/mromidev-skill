# Episode package format

Supply a runnable project with `package.json`, `src/index.ts`, composition
registration with the exact episode frame count, scene source, assets, and
`render.cjs` from [the repo launcher](../scripts/render.cjs). Bundle aligned
English karaoke and SRT, local Poppins Bold, the final mix, and editable stems
and cue information. Use 1080×1920 at 30 fps. Keep the video title in the
filename or metadata.

The PC uses existing Node, shared `node_modules`, and installed Chromium.
Everything needed for the episode itself is local when the render starts.
Use [the offline preflight and range commands](../workflow/animation-qc.md)
before the final MP4. Verify H.264/yuv420p, audio sync, and faststart after export.
