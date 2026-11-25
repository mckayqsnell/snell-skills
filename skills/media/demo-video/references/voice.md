# Voiceover

A voice that talks over the demo. Only when the user said yes in step 2. `recorder/voice.mjs` does the work: run it from the workspace. The user's own live voice, recorded with the demo, is a different path: [`recorded.md`](recorded.md).

## Pick the voice

1. `node recorder/voice.mjs check` prints what this machine can run, the download size and memory each needs, the license, and the setup commands if something is missing. It never prints the ElevenLabs key, only whether it found one.
2. Offer only what `offer` lists, with your pick first:

| Voice | What it is | Needs | Cost and license |
|---|---|---|---|
| **Ming-3.0** (default on a Mac) | Clear and natural. 5 tested presets (`US_Emma`, `US_James`, `US_Stella`, `UK_George`, `UK_Charlotte`), a voice made from a written description, or a copy of the user's voice | Apple Silicon, about 6 GB download, 4–5 GB memory | Free, MIT |
| **Fish Drama 3** | The best-sounding free voice (Artificial Analysis open-weights leader, Nov 2026). Copies a voice: a Ming preset or the user's own | Apple Silicon with 32 GB or more, 22 GB download, about 28 GB memory while it runs | Free to try. Business use is free only under $500k a year in revenue; say this before offering it for work videos |
| **Kokoro** | Small and fast, a little flatter. 8 good English voices (`af_heart`, `bm_george`, …) | Any OS, about 330 MB | Free, Apache-2.0 |
| **ElevenLabs** | The best overall, and paid | `ELEVENLABS_API_KEY` | The free plan (10k characters a month) is for personal use with credit to ElevenLabs; work videos need a paid plan |

3. **Set it up** if `check` printed `setup`. Ask the user first and say the sizes: about 1 GB of Python packages, then each model downloads on first use. The commands make one venv at `~/.cache/snell-skills/mlx-audio/` that every video reuses. An mlx-audio venv the user already has works too: `DEMO_VOICE_PYTHON=<its python>`.
4. **Let the user listen.** `node recorder/voice.mjs samples ming` (or `kokoro`, `fish`, or a list: `samples ming US_Emma,UK_George`) makes one line per voice and `voice/samples.html`. Open it for the user, and let them pick by ear. A voice from a description: put `"instruct": "A calm man in his forties, warm and unhurried"` in the script instead of `voice`.

### ElevenLabs

- The key comes from `ELEVENLABS_API_KEY`, else from `~/.config/snell-skills/local.env` (a line `ELEVENLABS_API_KEY=...`). That file sits outside the plugin, so updates never wipe it. Never print the key, log it, or write it into the workspace.
- `node recorder/voice.mjs samples elevenlabs` lists the account's voices for free. `samples elevenlabs <id>,<id>` reads the sample line in each (about 100 characters each).
- The default model is `eleven_v4`; set `"model"` in the script to change it. Each line is sent with the lines around it (`previous_text`, `next_text`), so they flow together.

### Your own voice

The user can have the demo read in their own voice without recording the whole thing:

1. They read the paragraph below for 15 to 20 seconds, in a quiet room, about a hand's width from the mic, at their normal pace. On a Mac: QuickTime → New Audio Recording, or `ffmpeg -f avfoundation -i ":0" -t 20 -ac 1 voice/me.wav`.
2. Save it as `voice/me.wav`, and what they said, word for word, as `voice/me.txt`.
3. Set `"voice": "me"` with `fish` (closest copy) or `ming`.

> Hi, thanks for joining. In the next minute I'll walk you through a small tool that saves a lot of clicking, and I think you're going to like it.

A copy of a voice never leaves the machine: `voice.mjs` refuses to send a recording to ElevenLabs. Use only the user's own voice, or one whose owner said yes. To use their voice on ElevenLabs, they clone it in the ElevenLabs app themselves and give you that voice id.

## Write the script first

The edit fits the voice, not the other way round. Write `voice/script.json` from the shot list before you cut:

```json
{ "provider": "ming", "voice": "US_Emma",
  "lines": [
    { "id": "v01", "track": "title", "t": 0.4, "text": "Every report, in one place." },
    { "id": "v02", "track": "story-cut", "mark": "export-start", "offset": 0.2, "text": "Pick the ones you need and export them in one go." },
    { "id": "v03", "track": "story-cut", "at": 41.5, "text": "Done. Nothing to fix by hand.", "max": 2.5 }
  ] }
```

- `track` is the scene the line plays in: a cut's name, or a card. `t` is a time in that scene; `at` (a time in the raw take) and `mark` (a mark from the take) follow the cut when you re-time it. Prefer `mark`: pin each line to the mark of the screen it talks about, so it never starts over the screen before.
- One idea per line, at most about 2.5 words a second of its beat. Say what the picture can't: the why, not "now I click Export".
- `say` overrides how a line is spoken without changing the caption: `"text": "Export to SQL", "say": "Export to sequel"`. Write numbers and short forms the way people say them.
- Fish takes a delivery style in brackets: `"style": "warm, friendly narrator"`. A style can't set an accent: for one, copy a voice that has it (`"voice": "ming:UK_Charlotte"`).

## Make, check, place

1. `node recorder/voice.mjs make` makes 2 takes of every line (Kokoro: 1), trims the silence, levels each to −18 LUFS, transcribes it, and keeps the take that says the words and fits. It writes `assets/voice/<id>.wav` and `<id>.words.json` (word times, for captions). A line with `warn` dropped or swapped words: listen, reword it, or spell it out with `say`, then `make --only <id>`. Whisper sometimes mishears a short line that was fine: if it sounds right in the transcript of the full mix, keep it.
2. Rough times on Apple Silicon: Ming about 3× faster than real time after a 3 s load; Fish 1–2× real time after a 10 s load; Kokoro under 1 s a line. Each model loads once per `make`.
3. After each cut: `node recorder/voice.mjs place <track>`. It puts each line at its time, checks that every line ends 0.25 s before the next starts, and writes `assets/audio/<track>-voice.wav` and `voice/<track>-fit.json`. A line that is `short_by` some seconds needs room: hold its beat longer (a freeze `t~hold`, or a slower span in the cut), or shorten the line. Then make and place again until `fits` is true.
4. Play `assets/audio/<track>-voice.wav` as an `<audio>` from that scene's start, next to the UI sounds.

## Mix

The voice leads. With a voice:

- UI sounds go quieter: `sfx.mjs <cut> --gain 0.35`.
- Music is a bed under the voice, about −28 LUFS, ducked while the voice talks. Make the ducked bed before the render, keyed on a voice track as long as the music (pad each scene's voice wav to its scene start with `adelay` and `amix` them):

  `ffmpeg -i music.mp3 -i voice-all.wav -filter_complex "[0:a][1:a]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=450[m]" -map "[m]" assets/audio/music-ducked.wav`

- Master the render to **−16 LUFS, true peak under −1.5 dB** ([`hyperframes.md`](hyperframes.md) "Check and render"). Check the voice with `npx hyperframes transcribe` on the render: every line should come back word for word.
