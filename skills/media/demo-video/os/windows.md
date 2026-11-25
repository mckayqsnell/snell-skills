# Windows

Setup for Windows. `check-setup.mjs` sent you here; fix what it marked `MISSING`, then go back to `../SKILL.md` step 2.

## Which shell

Claude Code on Windows runs commands in Git Bash (its Bash tool) or PowerShell. In Git Bash every command in this skill works as written. In PowerShell the `node …` commands work too; write `$env:NAME = "value"` where a step says `export NAME=value`.

Quote every path. Windows user folders often have spaces (`C:\Users\First Last`). Forward slashes work in paths given to `node`.

## Install what's missing

Ask the user before you install anything.

| Missing | Install |
|---|---|
| ffmpeg | `winget install Gyan.FFmpeg` (it brings `ffprobe`). PATH changes only show up in a new terminal: ask the user to restart Claude Code, or run ffmpeg by its full path until then. |
| playwright | `npm install -g @playwright/cli` |
| browser | The recorder uses Chrome, then Edge (always on Windows 10 and 11), then Playwright's own Chromium. If neither shows up: `playwright-cli install-browser chromium`. |

Run `node <skill>/scripts/check-setup.mjs` again until it prints `ready: yes`.

## Good to know

- The Windows window frame is bigger than on a Mac. `launch()` pins the page size over CDP, so takes still come out at 3200 px. If a take stops with "page is …x… at …x", send the user that error: it means the pin failed.
- Display scaling (125%, 150%) doesn't change the frames: the browser runs headless at a forced scale.
- HyperFrames finds Chrome or Edge on Windows by itself.
- `cleanup.mjs` closes `playwright-cli` sessions through the shell (Windows needs that for `.cmd` commands). If it says it could not close one, ask the user to close that browser by hand.
- Show the user the result with `start "" "renders\<app>-demo.mp4"` (Git Bash: `cmd //c start "" "renders\<app>-demo.mp4"`).
