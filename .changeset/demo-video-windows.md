---
"snell-skills": patch
---

**demo-video** now works on Windows and Linux, and picks the setup for the machine it's on:

- a new `check-setup.mjs` says which OS this is, which `os/macos.md`, `os/windows.md` or `os/linux.md` to read, and whether ffmpeg (with libx264), Playwright and a browser it really starts are ready, with the fix for that OS; SKILL.md step 1 runs it and reads only that file;
- on Linux it gives the right fixes for Playwright's Chromium and its system libraries, Fedora's ffmpeg, Alpine (no browsers) and HyperFrames on ARM (no Chrome download there, so it points HyperFrames at Playwright's Chromium);
- the recorder and `sheet.mjs` try Chrome, then Edge on Windows, then Playwright's Chromium;
- it finds a global `playwright-cli` on Windows too (it used to need `sh`), reading npm's and pnpm's `.cmd` shims (and newer pnpm's sh shim on macOS and Linux), with npm's global folder as a fallback;
- cleanup closes its browser sessions on Windows (Node won't start the `.cmd` shim without a shell, so the error was hidden and browsers stayed open), and says so when it can't close one; session names are now checked to be plain names;
- the recorder gets the page size right on Windows: when the window frame doesn't match the built-in guess (on Windows it's bigger, so every take stopped with "page is 624x353"), it pins the page size over CDP and keeps the forced scale, so frames stay full size;
- the ffmpeg frame list uses bare file names, so Windows drive letters and backslashes never reach it;
- `platforms/web.md` says how the page size is pinned, and to record from the page `launch()` returns;
- the setup table gives the Windows install for ffmpeg (`winget install Gyan.FFmpeg`) and the Playwright install command, and says to quote paths with spaces.
