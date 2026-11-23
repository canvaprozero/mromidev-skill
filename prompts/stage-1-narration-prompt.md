# Stage 1 — prompt narasi (paste ke ChatGPT)

**Cara pakai:** isi placeholder `[TOPIK]`, `[DURASI]`, `[GAYA]`, `[NICHE]`
di dalam prompt di bawah, lalu paste seluruh blok `text` ke chat ChatGPT
Plus baru. Upload juga `chatgpt-from-scratch.zip` ke chat yang sama
supaya ChatGPT punya konteks proyeknya. ChatGPT akan mengembalikan
naskah narasi bernomor + saran setting AI Studio — setujui dulu naskahnya
sebelum lanjut ke generate audio.

```text
You are writing the narration script for a short animated video in the
"how it feels to be a [profession]" niche, in the mromidev cartoon-3D
style (2D billboard characters in a 3D toon world, Remotion + three.js).

VIDEO BRIEF (fill these in before pasting):
- TOPIC: [TOPIK — e.g. "how it feels to be a night-shift nurse"]
- NICHE: [NICHE — default: "how it feels to be a [profession]"]
- DURATION: [DURASI — 30 or 60 seconds; default 60]
- STYLE: [GAYA — default: mromidev cartoon 3D]
- LANGUAGE: [BAHASA — default: English]

HARD RULES — the script must obey all of these:
1. PACING: the narration must fill the slot at 3.2–3.6 words per second of
   SPOKEN audio. Target word counts (spoken words only, not counting tags):
   - 30 s video: ~90–100 words (spoken audio ~27–28 s, ~2–3 s closing hold)
   - 45 s video: ~130–140 words (spoken audio ~42–44 s)
   - 60 s video: ~175–185 words (spoken audio ~54–57 s, ~4–5 s closing hold)
   The narration must END before the slot ends — the last seconds of the
   video are a silent closing hold after the final line.
2. STRUCTURE (the mromidev script formula — do not deviate):
   - Line 1: a HOOK — a paradox stated as fact, one sentence, ~10–16 words.
   - Lines 1–2: hook + setting, second person ("Imagine you are…"),
     present tense.
   - Middle: escalation in 3–6 beats, with one short piece of in-character
     dialogue (someone shouting a line at the protagonist).
   - One MYSTERY beat: a "Wait, …?" question that reframes what the viewer
     thought.
   - One PIVOT: a line starting "You see," that begins the explanation.
   - The MECHANISM: explain the real mechanism with an everyday analogy
     (one concrete image, e.g. "water escaping as steam").
   - Last 1–2 lines: an ironic PAYOFF, then a COLD CLOSE — end on the
     image, no call to action, no "like and subscribe", no moral.
3. ONE LINE = ONE IDEA = ONE CAPTION LINE. One line break per line. A line
   is one sentence (occasionally two very short ones). No line is longer
   than ~20 words. Shot boundaries in the animation will land on line
   boundaries, so never split one idea across two lines.
4. Second person throughout ("you"), present tense. Concrete sensory
   details (sounds, smells, textures, numbers). No brand names, no
   trademarked logos, no real company names.
5. This script will be recorded as ONE continuous audio file, all lines at
   once — write it as one flowing performance, not as isolated lines.
6. EXPRESSION TAGS (for Google AI Studio, Gemini 3.8 Flash TTS) — use them
   SPARINGLY (a few per script, only where the performance genuinely needs
   them):
   - Inline tags in ANGLE BRACKETS ONLY: <laugh>, <gasp>, <sigh>,
     <chuckle>, <breath>, <short pause>, <long pause>. Put the tag exactly
     where the sound happens.
   - NEVER use square brackets [laugh] — that was the OLD Gemini 3.1
     syntax and does NOT work on 3.8.
   - Turn-level direction (the overall delivery) does NOT go in the text —
     it goes in the separate "style" field in AI Studio, which you will
     suggest below.
   - CAPITALS add stress to a word; "..." adds hesitation. Use both rarely.
   - Tags are vocal events, NOT words: they take time in the audio but do
     not count toward the word count in rule 1. Keep the total added
     pause/burst time small so the narration still fits the slot.
7. The script must read naturally aloud. No tongue-twisters, no awkward
   alliteration, no numbers that are hard to say (write "twenty" not "20"
   if it reads better — but keep it natural).

OUTPUT FORMAT — return exactly this, nothing else before or after:
- The script as NUMBERED LINES, one per line, in this format:
  1. [line 1]
  2. [line 2]
  ...
  (Include the <tags> inline in the lines, exactly as they should be pasted
  into AI Studio.)
- Then a line: "Word count: N words (spoken words only, tags excluded)."
- Then "AI STUDIO SETTINGS:" with three lines:
  - Model: gemini-3.8-flash-tts
  - Voice: [one prebuilt voice, default Tavi — pick another only if the
    topic clearly needs a different gender/character, and say why in one
    short sentence]
  - Style: [one short style direction for the style field, e.g. "warm,
    curious narrator, conversational, second person"]
- Then one short paragraph: why this script fits the slot (pacing math:
  N words ÷ ~3.3 w/s ≈ X s spoken, leaving ~Y s of closing hold).
```
