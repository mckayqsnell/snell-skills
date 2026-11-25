# Full mode: the edit in HyperFrames

Load the `hyperframes:hyperframes` skill first and follow its contract and work loop; this file only adds what a screen-recording demo needs. Run the CLI the way that skill says (`node <SKILLS>/hyperframes/scripts/plugin-cli.mjs <command>` from the workspace), written below as `npx hyperframes`.

## Set up

1. In this order (a custom name goes to both: the same path to `init`, and `[name]` to `setup.mjs`): `npx hyperframes init <workspace> --non-interactive --skip-skills --skill=hyperframes` (it refuses a folder that isn't empty; get the path from `setup.mjs <app-repo> --print-path`), then `node <skill>/scripts/setup.mjs <app-repo>`, which adds `recorder/`, `assets/demo-kit.js` and `assets/scene.css` without touching what `init` made. `init` also writes `AGENTS.md`, `CLAUDE.md` and `package.json` into the workspace; leave them.
2. Set the root to 60 fps: `data-fps="60"` on `#root` in `index.html`, at 1920×1080 (or 1080×1920 for `vertical`, with `DemoKit.setFrame(1080, 1920)`).
3. Copy the app's own fonts, logo and colors into `assets/` and set the variables at the top of `assets/scene.css`. Read them from the app's code; never redraw a logo. If the app loads its font from a CDN (Google Fonts) or names one it doesn't ship, use a brand font the repo does ship (search for `fonts/`), else the first font in its stack that HyperFrames bundles; ask before downloading one. Note the swap in `SPEC.md`.
4. Copy the sounds `sfx.mjs` needs (`key-press.mp3`, `click-soft.mp3`) and any others you place (whoosh, pop, impact, riser) from the `media-use` skill's `audio/assets/sfx/` into `assets/sfx/`.

## Layout

`index.html` holds only scene hosts and audio. One sub-composition per beat in `compositions/`: a hook, a title card, the story take, a claim, an end card. Scenes sit back to back on one track. The hook is a second cut of the same raw take (`cut.mjs story hook "…"`), with its own `sfx.mjs hook` track, so it never needs a separate recording.

Sounds and media placed at the root (impacts, chimes, the hook's `data-media-start`) sit outside `kit.src()`. Keep their source times in one list in `SPEC.md` and map them with `node recorder/srctime.mjs <cut> <t1,t2,…> <scene start>` after every re-cut.

The story scene plays the cut clip inside a camera. Its markup:

```html
<template>
  <link rel="stylesheet" href="assets/scene.css" />
  <div id="root" data-composition-id="story" data-width="1920" data-height="1080" data-duration="51.4">
    <div class="stage" data-layout-allow-occlusion><div class="window"><div class="aura"></div><div class="ring"></div>
      <div class="viewport" data-layout-allow-overflow><div class="cam">
        <video id="story-video" class="clip screen-video" data-start="0" data-duration="51.4" src="assets/clips/story-cut.mp4" muted playsinline></video>
        <svg class="cursor" viewBox="0 0 24 24"><path d="M5 2.5v18.2l4.6-4.3 3 6.6 3.1-1.4-3-6.4h6.4z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>
      </div></div></div>
      <div class="caption lower" id="cap-1">It does <span class="accent">the thing</span></div>
    </div>
  </div>
  <script src="assets/demo-kit.js"></script>
  <script src="assets/data/story-cut.js"></script>
  <script>
    var root = document.querySelector('[data-composition-id="story"]');
    var kit = DemoKit.scene(root, window.__demo['story-cut']);
    var tl = gsap.timeline({ paused: true });
    tl.fromTo(root.querySelector('.window'), { opacity: 0, filter: 'blur(12px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.5, ease: 'expo.out' }, 0);   // the app enters with a blur swap, never pops on
    kit.shot(tl, 0, 0, {});                                                   // the whole app, full frame
    kit.caption(tl, root.querySelector('#cap-1'), 0.6, 2.4, 'pill');
    kit.shot(tl, 3.4, 1.1, { rect: INPUT_BOX, z: 1.15 });                     // a gentle punch-in on a logged box
    kit.cursor(tl, 51.4);                                                     // the drawn cursor, from the log
    window.__timelines['story'] = tl;
  </script>
</template>
```

## The camera

- `kit.shot(tl, at, dur, { rect, z, box, ease })` frames a rect (recording CSS px) at zoom `z`, full frame (the default) or in the inset window (`box: 'inset'`). Take every rect from a `box` event in `raw/<clip>.events.json` or measure it from a frame; never guess.
- **Write times as source times** in the raw take and map them with `kit.src(t)`: `kit.shot(tl, kit.src(41.4), 0.6, …)`. Changing a speed ramp then never knocks the camera off its target. A freeze (`t~hold`) maps from its exact `t`.
- **Pace for a first-time viewer.** At most one camera move every 3 s. Hold at least 2 s after the screen or the camera lands, whichever is later, measured on frames, before the next move or cut. Moves: 1.1–1.2 s `power2.inOut`, the kit's default ease (a sharper ease shows only half the move and reads as a snap). Arrivals: `expo.out`. A zoom-through to the next scene: 0.38–0.4 s `power3.in` with a 6–8 px blur, landing on the button the cursor pressed (freeze that frame in the cut).
- **Zoom gently.** `z` is relative to the box: 1 shows the whole app, and `kit.shot` caps it at 1.3, so at least about three quarters of the app stays on screen and the viewer always knows where they are. Most punch-ins want 1.1–1.2. A centered zoom on a right-side target crops the logo and breadcrumb: use `anchor: 'tl'` (it pins the top-left corner, so the target must sit inside the part that stays on screen), or stay at z 1. Raise the cap (`DemoKit.setMaxZoom`) only for one line being typed. Make the first zoom the softest: the viewer hasn't seen the layout yet.
- Push in to read (typing, an answer, a result), pull out to show a change across the page. Hold still while the viewer reads. The window should fill the frame whenever the UI is the subject: small UI floating in empty space reads as a mistake.
- **A canvas that re-fits in one frame** (React Flow after a node lands): don't counter-zoom the camera to hold the nodes still, since that jumps all the other UI on that frame. Lay a still of the frame before the jump over the video and dissolve it out over 0.2 s. Extract that frame with `ffmpeg -i <clip> -vf "select=eq(n\,N-1)" -frames:v 1 …` (`-ss` lands a frame late). Check the fix on whole frames, in a render: `snapshot` picks video frames slightly differently.
- The cursor is counter-scaled, so it stays 40–70 px on screen at any zoom. The press is shown by a small squeeze; let the UI's own response be the click feedback, with no click rings.

## Captions and cards

- **A light app:** set the stage's ground variables in `scene.css` to the app's own background, so a full-frame scene never flashes dark between light scenes and cards. Fade in a dark ground only for inset beats.
- **Full frame is the default** for every beat where the app is the subject: it is biggest, sharpest and uncropped. Use the inset window (`box: 'inset'`) only for a beat that needs room beside the app: the title over the first look, a big caption, the claim. Move in or out of it at a calm moment, not mid-action.
- One short line per beat with one accent word. Over a full-frame shot: `class="caption lower"` with style `'pill'`, low in the frame. It must not cover what it talks about: at the shot's zoom, keep the app's bottom edge above y ≈ 920, or move the caption to the top. Snapshot every caption beat to check. Beside an inset: the plain `.caption` on the left, entering with `'words'`, `'line'` or `'ink'`; vary them, since every caption entering the same way reads as a template.
- Start a beside-the-inset caption only after the move into the inset has finished, so the window has cleared that side.
- Readable at 360 px wide: check one frame scaled down.
- Title and end cards use the app's own logo and face. Search the registry (`/hyperframes-registry`) before you hand-build a card or a transition.
- Banned by default: three cards in a row, a logo docked in a corner, titles that drift after they land, everything centered.

## Sound and music

- `node recorder/sfx.mjs <cut>` writes `assets/audio/<cut>-ui.wav`; play it as an `<audio>` from the story scene's start. It writes them about 5 dB under the samples' own level, so they sit under the picture; keep it there (`--gain 0.8` only if the critics can't see any onsets in `audio --json`).
- **A voiceover** ([`voice.md`](voice.md)) leads the mix: play `assets/audio/<cut>-voice.wav` from the scene's start, drop the UI sounds to `--gain 0.35`, and duck any music under it.
- Place impacts, whooshes and pops by hand on the frames that move. Trim leading silence and give impacts about a 1.15 s exponential fade (`silenceremove`, `afade curve=exp`), or the cut-off plays as a click. Leave out room tone: users hear it as an airplane hum. Measure the sound with `npx hyperframes audio <render> --json` (onsets, loudness): nobody can listen to it.
- **Music** (only when the user said yes): get it with the `media-use` skill (`media-use resolve --type bgm`: the HeyGen catalog when signed in, or a generated track), or use the file the user downloaded from Pixabay. Run `npx hyperframes beats` on it and land the hero moment, the payoff and the end mark on its strongest beats or the drop. Cuts follow the motion, not the drums. Keep music under the UI sounds: the bed around −23 LUFS, UI sound peaks 6–8 dB over it, key ticks quieter than clicks. Start the track on a bar line so the title hit lands on a downbeat, fade in over 0.5–1 s, and fade out over 2–3 s ending on the end card's last frame, with a linear fade (an exponential one goes silent 2 s early and leaves the card quiet). Duck the music 3–4 dB under hero impacts (`sidechaincompress` keyed on the sfx track).

## Check and render

1. `npx hyperframes check --json > review/check.json`, then read the file (piping into `head` can cut the JSON off): fix every error. `check` leaves a warm Chrome running for about 5 minutes; that one is expected. `npx hyperframes snapshot --at <t,…>` at each beat's midpoint and look at the PNGs.
2. HyperFrames renders one video at a time per account: a second render waits for the lock. Wait for it; don't report a waiting render as failed. Draft renders while you work: `npx hyperframes render --quality draft -o renders/draft-1.mp4`.
3. The final: `npx hyperframes render --fps 60 --video-bitrate 14M -o renders/<app>-demo.mp4` (leave out `--quality delivery`: it overrides the bitrate). The default bitrate shows blocking in fast motion at 1080p60. `ffprobe` it: the length must match the root's `data-duration`, and the video bitrate should be up to about 14 Mb/s (lower is normal for a mostly still UI).
4. Master the sound: with a voice (a voiceover or the user's own), to −16 LUFS with a true peak under −1.5 dB; with music and no voice, to about −15 LUFS with a true peak under −1 dB; with UI sounds only, to about −24 to −21 LUFS with a true peak around −2 to −3 dB, the limiter barely working (more gain only crushes the clicks and makes them loud again). Measure with `ffmpeg -i <render> -af ebur128=peak=true -f null -`. Gain alone clips a spiky UI-sound track, so raise it through a limiter, audio only: `ffmpeg -i <render> -c:v copy -af "volume=<dB>dB,alimiter=limit=0.7:level=disabled" -c:a aac -b:a 192k <delivery>.mp4`, then measure again.
5. Before the final render, start the Studio preview and tell the user they can keep editing there. When nobody is watching (the user is away, or you run as a sub-agent), start it with `preview --background --no-open`, render anyway, and stop it at clean-up unless the user wants to edit.
