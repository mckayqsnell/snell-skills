# The critics

Before you start them, make the labelled whole-video sheet once yourself: `node recorder/sheet.mjs <render> review/sheet-all.png 0 <end> 0.5 6 320`. The critics then use only ffmpeg, so two of them never open browsers at once.

Two critic sub-agents review every render with fresh eyes: they see what is in the frames, not what you meant. Run them in parallel on the same render. A video over 2 minutes, or one with a lot of sound, gets a third critic: frame, legibility and sound (palette, type, brand, captions at 360 px, where every sound lands).

| Critic | Lens | Reads first |
|---|---|---|
| Motion and timing | camera moves, eases, cuts, speed ramps, holds, the cursor, sound on the frame; flag any shot that crops the logo, the breadcrumb or the thing being read, any zoom over 1.3, and any move sooner than 2 s after the last arrival | HyperFrames `references/motion.md` and `references/review.md` |
| Story and clarity | does each beat land, is every feature clear to a first-time viewer, are captions readable, any dead frames | `SPEC.md` and the shot list |

## The brief (send each critic this, with its lens filled in)

> You are reviewing a rendered product demo, `<render path>` (1920×1080, 60 fps, <length> s), of `<app>` for `<audience>`. Goal: `<the SPEC goal line>`. User choices (never contest these): `<music choice, length range, must show, must hide>`. A fix must keep the film inside the agreed length. Your lens: `<lens>`. Read `<files>` first.
>
> You can't play video, so look at real frames. From `<workspace>`:
> - Start with the labelled whole-video sheet at `review/sheet-all.png` (2 fps; the time of each tile is in its corner).
> - For close looks, make ffmpeg strips: `ffmpeg -y -ss <from> -t <len> -i <video> -vf "fps=<n>,scale=320:-2,tile=6x<rows>" -frames:v 1 review/scratch/<name>.png`. Tile i (from 0, left to right, top to bottom) is at `<from> + i/<n>` s. Use 15–30 fps for moves, cuts and impacts.
> - `ffmpeg -ss <t> -i <video> -frames:v 1 review/scratch/<name>.png`: one full-size frame, to judge legibility.
> - Sound, which you can't hear: `npx hyperframes audio <video> --json` (onsets, loudness), and `ffmpeg -i <video> -af silencedetect=n=-50dB:d=1.5 -f null -` for dead stretches.
> Use ffmpeg only, no browser: the other critic is working at the same time. Start every file name with `<lens prefix>-` (`motion-`, `story-`) so the two never overwrite each other. Look at every image you make.
>
> Be a demanding director, not a pedant: only notes that change how the video lands for a first-time viewer. At most 8 notes, ranked, one line each:
> `P0|P1|P2 · t=12.3s · where · problem → exact change · what stays`
> P0 breaks the read or looks broken; P1 weakens it; P2 is polish (at most 2). Every note names a time you looked at and a concrete change: a number, an ease, a cut point, a rect, a word. "Feels slow" is not a note; "t=18–21 s the answer streams for 2.6 s with nothing new → speed source 5.6–18.5 s from 5x to 8x" is.
> The app's own UI and animations are the product: frame, time, speed or cut them, never ask to redesign them.
> Then list up to 3 things that work and must stay. No scores. Return only the notes and the keep-list.

## After the critics

1. Merge the notes. When two critics disagree, the story critic wins on what to show and the motion critic wins on how it moves.
2. Fix every P0 and P1 in the edit; retake only when the footage itself is wrong. Write what you changed in `REVIEW.md`.
3. Re-render and run both critics again on the new render, each told what changed so it checks the fixes. Stop after 2 rounds of fixes.
4. Then one last combined pass on the final render that reports only P0 and P1 notes. Fix those, check them on frames, and hand over with anything left listed.
5. Delete `review/scratch/` when the review is done.
