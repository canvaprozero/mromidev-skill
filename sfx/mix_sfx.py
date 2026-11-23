#!/usr/bin/env python3
"""Mix an SFX cue list from the earshot palette into sfx.wav (24000 Hz mono).

Usage:
  mix_sfx.py --cues cues.json --dur SECONDS [--out sfx.wav]
             [--palette DIR] [--wind SECONDS] [--wind-vol 0.22]

cues.json: [{"file": "pop_soft.wav", "at": 3.2, "vol": 0.5}, ...]
  - "file" is a palette WAV name (24000 Hz mono, 16-bit) from PALETTE.md.
  - "at" is seconds, "vol" is linear gain (breath30 ranges: bed 0.22,
    ticks 0.3-0.4, moves 0.5, drops 0.55).

Wind bed: earshot has no long wind bed, so --wind renders the old synth
wind bed (one-pole lowpassed noise, seeded) of the given length at
--wind-vol. Everything else must come from the palette — do not
re-introduce synth pop/whoosh/chime; that is exactly the "itu-itu saja"
the palette replaces.

Variety rule (checked here, enforced by the cue designer): the same
file must not appear twice in a row — rotate variants inside a family
(pop_soft -> pop_wide -> pop_round -> ...). This script WARNS on a
repeat but still renders, so a deliberate repeat stays possible.

Output is peak-normalized to 0.5, like the old synth scripts.
Stdlib only: no numpy/scipy needed.
"""

import argparse
import json
import math
import os
import random
import struct
import sys
import wave

SR = 24000


def read_wav(path):
    with wave.open(path, "rb") as w:
        if w.getframerate() != SR or w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise ValueError(
                f"{path}: expected 24000 Hz mono 16-bit, got "
                f"{w.getframerate()} Hz {w.getnchannels()}ch {w.getsampwidth() * 8}-bit"
            )
        frames = w.readframes(w.getnframes())
    return [v / 32767.0 for v in struct.unpack(f"<{len(frames) // 2}h", frames)]


def synth_wind(dur, seed=20261031):
    """Port of the old synth wind bed (seeded, deterministic)."""
    rnd = random.Random(seed)
    out = []
    lp = 0.0
    n = int(dur * SR)
    for k in range(n):
        w = rnd.uniform(-1, 1)
        lp = 0.98 * lp + 0.02 * w
        t = k / SR
        env = min(1.0, t / 0.4) * math.exp(-t / 1.4)
        out.append(lp * 3.0 * env)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cues", required=True)
    ap.add_argument("--dur", type=float, required=True)
    ap.add_argument("--out", default="sfx.wav")
    ap.add_argument("--palette", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "24k"))
    ap.add_argument("--wind", type=float, default=0.0)
    ap.add_argument("--wind-vol", type=float, default=0.22)
    args = ap.parse_args()

    with open(args.cues) as f:
        cues = json.load(f)
    if not isinstance(cues, list):
        raise ValueError("cues.json must be a list of {file, at, vol}")

    n = int(args.dur * SR)
    buf = [0.0] * n

    prev = None
    for c in cues:
        if c["file"] == prev:
            print(f"WARNING: repeat file in a row: {c['file']} at {c['at']}s "
                  f"(rotate variants inside the family)", file=sys.stderr)
        prev = c["file"]
        samples = read_wav(os.path.join(args.palette, c["file"]))
        i0 = int(c["at"] * SR)
        vol = float(c.get("vol", 0.5))
        for k, v in enumerate(samples):
            i = i0 + k
            if 0 <= i < n:
                buf[i] += vol * v

    if args.wind > 0:
        for k, v in enumerate(synth_wind(args.wind)):
            if k < n:
                buf[k] += args.wind_vol * v

    peak = max(max(buf), -min(buf), 1e-9)
    buf = [v / peak * 0.5 for v in buf]
    with wave.open(args.out, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(b"".join(struct.pack("<h", int(v * 32767)) for v in buf))
    print(f"wrote {args.out} {args.dur}s peak {peak:.3f}")


if __name__ == "__main__":
    main()
