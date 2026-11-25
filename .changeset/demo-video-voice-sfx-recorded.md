---
"snell-skills": minor
---

**demo-video** can now talk, has new sounds, and edits demos you recorded yourself:

- **Voiceover** (opt-in, asked in the interview): `voice.mjs check` says which voices this machine can run, with sizes, memory and license. Ming-3.0 (free, MIT) and Fish Drama 3 (the best free voice, 32 GB+ Macs, free for business use only under $500k revenue) run locally through mlx-audio; Kokoro runs anywhere; ElevenLabs (`eleven_v4`) is opt-in with a key in `ELEVENLABS_API_KEY` or `~/.config/snell-skills/local.env`, never printed. `samples` makes a page to pick a voice by ear. Fish and Ming can copy the user's own voice from a 20-second recording, which never leaves the machine.
- The script comes first and the edit fits the voice: `make` keeps the best of 2 takes per line (it transcribes each and checks it says the words), and `place` lays the lines on the cut and says which need a longer beat. Videos with a voice master to −16 LUFS.
- **Sound packs** (opt-in): `sfx-packs.mjs get soft` fetches the latest uisfx pack (12 packs, CC0) from GitHub, one fixed repo, MP3 files only, nothing run. `sfx.mjs --pack soft` uses it for clicks and keys, and any mark named `sfx:<cue>` (or `--at cue@t`) plays that cue. HyperFrames' own sounds stay the default. `sfx.mjs` now reads each sound once, so long takes stay one short ffmpeg command (and works with ffmpeg 9).
- **Recorded mode**: give `/demo-video` a video file or a folder of takes. It transcribes them locally, interviews the user for the vital features, drafts a cut, and shows a cut plan page to approve (`cutplan.mjs`). `edl.mjs` cuts several takes on whole words, at the quietest point near each word edge, with 30 ms fades, flags any join inside a phrase, speeds up waits, and cleans the voice. `kit.face()` puts the user's face in a round bubble that never zooms, and hides the webcam baked into the recording. A recording guide covers OBS, Loom, Cap, Screen Studio and QuickTime.
- The interview runs in menu rounds, each question with a suggested pick and its trade-off.
