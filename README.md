# mromidev-skill

A reusable production workflow for English-language vertical Shorts. The
visual baseline is Mromidev 3D with 2D toon characters grounded in a real 3D
world, built with Remotion and three.js. Choose a story format from the
premise, including horror, explainers, and the profession series.

## Start here

| Task | Entry point |
| --- | --- |
| Give the complete workflow to an agent | [SKILL.md](SKILL.md) |
| Approve the hook, sustained beats, and payoff | [Narration guide](workflow/narration.md) and [stage 1](prompts/stage-1-narration-prompt.md) |
| Make a MeowExplain episode | [Channel profile](profiles/meowexplain/README.md) |
| Track one episode through production | [Episode sheet](workflow/episode-sheet.md) |
| Board, animate, and review shots | [Stage 2](prompts/stage-2-scene-prompt.md) and [animation and QC](workflow/animation-qc.md) |
| Generate and mix sound effects | [Earshot guide](sfx/README.md) |
| Preflight and render on the PC | [Package format](prompts/chatgpt-format-spec.md) and [offline launcher](scripts/render.cjs) |

Approve story and voice first, then cast and timed blocking. Review motion and
effect-heavy shots before rendering the complete release. Use the installed
Node, shared dependencies, and preinstalled Chromium to render with local
episode assets. Save the published MP4 alongside the episode project,
alignment and SFX cue list so a later revision is reproducible.

## References

- [Examples](examples/) contains the profession narration drafts.
- [Reference scene files](reference/) contain visual and code snapshots such
  as the bridge and fry cook. Episode packages provide their own entry point
  and assets.
- The [animation bridge](https://github.com/mromidev/claude-animated-shorts)
  is from mromidev/claude-animated-shorts (MIT).
- [Earshot](https://github.com/Leonxlnx/earshot) is the SFX generation source.
