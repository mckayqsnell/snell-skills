# macOS

Setup for a Mac. `check-setup.mjs` sent you here; fix what it marked `MISSING`, then go back to `../SKILL.md` step 2.

## Install what's missing

Ask the user before you install anything.

| Missing | Install |
|---|---|
| ffmpeg | `brew install ffmpeg` (it brings `ffprobe`). No Homebrew: ask the user to install it from brew.sh first. |
| playwright | `npm install -g @playwright/cli` |
| browser | Most Macs have Google Chrome, and the recorder uses it. With no Chrome: `playwright-cli install-browser chromium`. |

Run `node <skill>/scripts/check-setup.mjs` again until it prints `ready: yes`.

## Good to know

- Homebrew's ffmpeg has no `drawtext` filter. The scripts don't need it: `sheet.mjs` draws its labels in a headless page.
- Recording runs headless, so it doesn't take over the screen, and the Mac's display scaling doesn't change the frames.
- Show the user the result with `open renders/<app>-demo.mp4`.
