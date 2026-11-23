---
"snell-skills": minor
---

New skill: **demo-video** (`/demo-video`, optionally with a length like `2 minutes` or `vertical`). It makes a polished demo video of an app you built, with no hands on the mouse:

- asks a few questions first (length, audience, music), then finds the app's main features and plans a story and a shot list;
- records clean 60 fps takes in a headless browser with Playwright's screencast feed (3200 px frames, no OS cursor) and logs every move, click and key;
- edits in HyperFrames with a smooth drawn cursor, punch-in zooms aimed from the log, captions, title and end cards and UI sounds, with music on beat when you want it; Quick mode uses Playwright's own cursor and cards when HyperFrames isn't installed;
- has two critic sub-agents review the frames, fixes what they find (2 rounds at most), and cleans up its browsers and scratch files.

Web apps first: other platforms get their own file later. Needs ffmpeg and Playwright (the global `playwright-cli` is enough); HyperFrames is suggested when missing.
