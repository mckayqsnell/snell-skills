# Quick mode: Playwright and ffmpeg only

For when HyperFrames isn't installed, or the user wants a fast cut. Playwright draws the cursor, the chapter cards and the captions into the page while it records. There is no camera move: the frame is the page.

Quick mode needs Playwright 1.64 or newer (`page.screencast.showActions`, `showChapter`, `showOverlay`): check with `node recorder/find-playwright.mjs`. On an older version, record with `recorder.mjs` (it falls back to raw CDP frames), add a title card and an end card with ffmpeg (`drawtext`, or a PNG you make with a headless page), and say in the hand-over that the cursor and captions are plain.

## The take

One Node script (or `playwright-cli run-code --filename take.js` with the body as `async page => { … }`):

```js
import { launch } from './recorder.mjs';
const { browser, page } = await launch({ width: 1280, height: 720, dpr: 2.5, theme: 'dark' });
try {
  await page.goto(APP_URL);
  await page.screencast.start({ path: 'raw/quick.webm', size: { width: 3200, height: 1800 }, fps: 60 });
  await page.screencast.showActions({
    cursor: 'pointer', duration: 700,
    style: { title: 'display: none', point: 'width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,.55)' },
  });
  await page.screencast.showChapter('Build a pipeline', { description: 'One prompt, five nodes', duration: 1800 });
  const cap = await page.screencast.showOverlay(`<div style="position:absolute;left:32px;bottom:32px;padding:10px 16px;
    border-radius:10px;background:rgba(0,0,0,.72);color:#fff;font:600 22px system-ui">It sees what you see</div>`);
  await page.getByRole('textbox').pressSequentially('Build me the Part pipeline', { delay: 45 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  await cap.dispose();
  await page.screencast.stop();
} finally { await browser.close(); }
```

- `showActions` paces every action by `duration` so its cursor has time to travel. Keep it at 500–800 ms.
- Use the app's own colors and face in overlays and chapter cards (`showChapter` takes a `styleSheet`).
- One chapter card per beat at most, and an overlay caption that leaves the action in view.
- Before you write it, check the newest screencast options (see `../platforms/web.md`): new ones may already do what you need.

## Finish

```bash
ffmpeg -y -i raw/quick.webm -vf "fps=60,scale=1920:-2:flags=lanczos,format=yuv420p" -c:v libx264 -preset slow -crf 16 -movflags +faststart renders/quick.mp4
```

Trim waits with `recorder/cut.mjs` first if you recorded with `recorder.mjs` instead (Quick mode can still use it: `engine` and the log work the same, the cursor just comes from `showActions`). Add music, when asked, with ffmpeg: `-i music.mp3 -filter_complex "[1:a]volume=0.35,afade=t=out:st=<end-2>:d=2[a]" -map 0:v -map "[a]" -shortest`. A voiceover works here too: make and place it with [`voice.md`](voice.md) (`place <track> --duration <length of the video>`), then lay `assets/audio/<track>-voice.wav` on with `-i <voice.wav> -map 0:v -map 1:a -c:v copy -shortest`, or `amix` it with the music after ducking the music under it ([`voice.md`](voice.md) "Mix").
