# Sound design with Earshot

Use the original [Leonxlnx/earshot](https://github.com/Leonxlnx/earshot) on the
production machine to generate cues. Pin the source commit used for the episode.
Keep the resulting WAVs in the episode package together with editable stems and
the final stereo mix. The offline PC render consumes the baked mix and needs
only the existing Remotion setup.

## Generate reproducible cues

Check the available IDs with `python -m earshot sounds`. From an environment
where the pinned Earshot checkout is installed, generate a cue like this.

```sh
python -m earshot make --sound door/creak --seed 713 --mono -o chair-squeak.wav
```

This example was verified with upstream commit
`7a7f7c5c70d4a763a1eca4b3666af7c77e313f97`. Use other durations, seeds and
design IDs to suit the action, and record all applied options. Keep stereo for
beds where spatial texture matters. Check loop seams and trim leading silence
or record the audible onset offset when a cue needs to hit a precise frame.

Store the Source URL and commit once with the cue list, and keep one row for
each mix placement. A motif can reuse a design on purpose.

| WAV | Earshot sound ID | Seed / options | Timeline anchor | Role / gain and automation |
| --- | --- | --- | --- | --- |
| chair-squeak.wav | door/creak | 713, mono | First chair flex, after payoff line | Foley, faded tail and gain set in the mix |

## Build and check the mix

- Start with clean narration and a quiet environmental bed appropriate to the
  location. Let the bed change with the story. Use music where the premise
  benefits from it and package any licensed audio locally.
- Add synchronized foley that matters to the story, such as the first hinge
  move, radio transmit switch, or final chair creak. Reserve the strongest
  accent for the evidence, decision or reveal viewers need to register.
- Make important lines easy to hear with fader movement or ducking. Create
  contrast by thinning the bed or pausing it around key information, then return
  with a deliberate sound. Listen for strength and clarity at low phone volume
  and on headphones. Check mono for phase problems and measure integrated
  loudness and true peak on the exported mix and the final AAC.
- Retain the narration, SFX, and ambience/music stems, the source cue list,
  and the stereo master. Align captions from the spoken take and keep its
  timing when printing the master.

## Existing episodes

The archived [palette](PALETTE.md), `earshot-24k.zip` and `mix_sfx.py` preserve
the old 24 kHz mono workflow for reproducing older mixes.
