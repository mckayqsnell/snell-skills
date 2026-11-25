# Recorded mode: a demo the user recorded themselves

The user talked through their app while recording the screen, maybe with their face in a corner (OBS, Loom, Cap, Screen Studio, QuickTime). Usually one or more long takes with waits, repeats and restarts. You cut it down to the parts that matter, keep their own voice, and add zooms, chapter labels, a face bubble, title and end cards. SKILL.md sends you here when the call names a video file or a folder of takes. Steps 1 (check the tools) and 9 (hand over) of SKILL.md still apply; this file replaces steps 2 to 8.

**Their recording stays on this machine.** Never upload it, commit it, or send its voice or face to any service. Never move or change the originals: link or copy them into the workspace.

## 1. Bring the takes in

1. Make the workspace as in SKILL.md step 6.1 (`setup.mjs <folder of the takes> <name>-demo-video`, plus `init` first in Full mode).
2. Link each take into `raw/` as `t1`, `t2`, … in the order they were recorded (file time): `ln -s "<take>" raw/t1.mov` (on Windows, copy). A separate webcam file for a take (OBS Source Record, Cap's `camera.mp4`, Screen Studio's raw files) goes in as `raw/t1.cam.mp4`. Loom and most others bake the face into the screen: that is fine.
3. `ffprobe` each take. Note its size and frame rate. If `avg_frame_rate` differs from `r_frame_rate` (a variable frame rate, common from phones and QuickTime), make a constant one first: `ffmpeg -i <take> -r 60 -c:v libx264 -crf 16 -c:a aac raw/t1.mp4`.
4. `node recorder/cutplan.mjs transcribe` writes `raw/<take>.words.json` for every take (local; a few seconds a take), then `node recorder/cutplan.mjs text` writes `cut/transcript.md`: every sentence with its take and times, long pauses, fillers, and redos ("cut that", "let me start over") marked.
5. Look at every take: `node recorder/sheet.mjs raw/t1.mov sheets/t1.png 0 <end> 3 6 320` (a frame every 3 s). Note where the webcam sits (measure its box on a full frame), and anything private on screen: tokens, keys, customer names, other people's email. Those need a blur or a cut; ask the user.

## 2. Interview the user

Ask in menu rounds (`AskUserQuestion` when you have it), each question with your suggested pick first and one line on what each option costs. Skip what the call or the takes already answer.

- **Round 1: what it is for.** Who watches and what they should do after (one line, into `SPEC.md`). The length: suggest one from what the takes cover (most land at 60–120 s; a 10-minute recording rarely needs more than 2 minutes). **Which features are vital**: list the features you found in the transcript as a multi-select, your picks ticked.
- **Round 2: the look.** The face: a round bubble (suggested, when there is a face), keep it as recorded, or none. Captions from their words: on or off. Music: none (suggested: a voice demo rarely needs it) or a quiet bed. The title line and what the end card asks for (a link, "try it", a contact).
- **Round 3: only if needed.** Anything to hide or blur, a take to leave out, a redo you can't place.

## 3. Draft the cut

Write `cut/edl.json` from `cut/transcript.md` and the vital features ([`edl.mjs`](../scripts/edl.mjs) has the format). The rules, from editors and from what users sent back:

- **Keep whole sentences.** Start a piece at the start of a sentence and end it after a sentence ends. A splice inside a phrase is what viewers hear, even when the words are right.
- **When the user names a thing, keep the sentence that says what it is.**
- **Let the last word play out.** End a piece after the word's sound has died, and leave 0.4–0.8 s of breath before a card.
- **Cut:** a long intro or apology, things said twice, recording directions, a redo and the attempt it replaces, and waits. A wait the viewer must see (a build running, a result arriving) stays at 2–6× and muted (`"speed": 4`); faster reads as a glitch.
- **Keep the speaker's pace.** Never speed up speech. Don't cut a single "um" inside a sentence; it costs a splice.
- Order by the story: pieces may come from any take, in any order, as long as cause comes before effect.
- Give each piece that starts a chapter a `label` ("Build a pipeline"): it becomes the chapter caption.

Then `node recorder/edl.mjs --check`. It snaps every edge to the quietest point near a word edge, prints what each piece says from first to last word, and flags joins inside a phrase. Fix every flag, or say in `SPEC.md` why it stays.

## 4. The user approves the plan

`node recorder/cutplan.mjs page` writes `cut/plan.html`: each piece with a frame, its times, what it says, its flags, and the total length. Open it for the user and wait for "looks good" or changes. Change `cut/edl.json` and make the page again until they approve. Nothing is cut before that.

## 5. Cut

`node recorder/edl.mjs` writes `assets/clips/<out>.mp4` (the picture and their voice, cleaned: rumble under 80 Hz and steady hiss removed; `"clean": false` to skip), `assets/data/<out>.js` (the pieces and every kept word at its new time) and `assets/data/<out>.json`. A separate webcam file is cut the same way into `<out>-cam.mp4`. Check the length it prints against the plan. If the voice is still noisy or echoey, say so and offer a stronger denoiser (DeepFilterNet); ask before installing it.

## 6. Compose

**Full mode** (HyperFrames): read [`hyperframes.md`](hyperframes.md) for the set-up, layout, camera and captions; what changes here:

- Use the recording's own frame size and rate on the root: 1920×1080 and the rate `edl.mjs` printed (`data-fps`).
- The voice is the sound track: `ffmpeg -i assets/clips/talk.mp4 -vn -ac 2 assets/audio/talk-voice.wav`, played as an `<audio>` from the story scene's start; the `<video>` stays `muted`.
- There is no drawn cursor and no event log: leave out `svg.cursor` and `kit.cursor`. Their own pointer is in the picture.
- **The camera follows the voice.** `clip.words` has every kept word at its time in the cut. Zoom about 0.3 s before the word that names the thing, onto a rect you measured on a frame from that piece. Pull out when they move on. All of `hyperframes.md` "The camera" applies.
- **Chapter captions** from the piece labels: a `pill` caption low in the frame, `01  Build a pipeline`, for about 2.5 s at each labelled piece.
- **The face bubble**, when the user wanted it:

```html
<div class="viewport" data-layout-allow-overflow><div class="cam">
  <video id="talk-video" class="clip screen-video" data-start="0" data-duration="98.4" src="assets/clips/talk.mp4" muted playsinline></video>
  <div class="face-cover"></div>                       <!-- hides the face baked into the recording -->
</div></div>
<div class="face"><video id="face-video" class="clip" data-start="0" data-duration="98.4" src="assets/clips/talk.mp4" muted playsinline></video></div>
<script>
  kit.face(tl, root.querySelector('.face'), { rect: { x: 0, y: 0, w: 286, h: 161 }, corner: 'bl', size: 280, at: 0.4,
    moves: [[kit.src(57.2, 't2'), 'br']] });         // out of the way of a zoom on the left
</script>
```

  `rect` is the webcam's box in the recording (measure it); leave out `rect` and `.face-cover` and point the bubble's video at `talk-cam.mp4` for a separate webcam file. Put the bubble in the corner the action is not in, and move it (`moves`) before a zoom would put the action under it. Snapshot every zoom to check the face never shows twice and never covers what the voice talks about.
- Title card over the first 2–3 s (the title line and the app's logo), and a 0.6 s dissolve into the end card after the last word.
- Captions from their words, if they wanted them: follow the hyperframes skill's captions reference with `clip.words`.
- Sound: no UI clicks (`sfx.mjs <cut> --no-ui` only for named cues such as a whoosh into a card). Music, if any, is a ducked bed under the voice ([`voice.md`](voice.md) "Mix"). Master to −16 LUFS, true peak under −1.5 dB.

**Quick mode:** the cut clip is the video. Add the title and end card with [`quick.md`](quick.md).

## 7. Review

Run the two critics ([`critics.md`](critics.md)) with one more job for the story critic: transcribe the render (`npx hyperframes transcribe`) and read it against the approved plan. Every sentence must be whole, nothing said twice, and every flagged join listened for. Fix every P0 and P1 and render again, at most 2 rounds.
