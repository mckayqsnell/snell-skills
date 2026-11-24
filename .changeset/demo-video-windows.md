---
"snell-skills": patch
---

**demo-video** now works on Windows:

- it finds a global `playwright-cli` on Windows too (it used to need `sh`), reading npm's and pnpm's `.cmd` shims, with npm's global folder as a fallback;
- cleanup closes its browser sessions on Windows (Node won't start the `.cmd` shim without a shell, so the error was hidden and browsers stayed open), and says so when it can't close one; session names are now checked to be plain names;
- the recorder sizes the browser window right on Windows: it measures the page and grows the window by the gap (the window frame there is bigger than the built-in guess, so every take stopped with "page is 624x353");
- the ffmpeg frame list uses bare file names, so Windows drive letters and backslashes never reach it;
- the setup table gives the Windows install for ffmpeg (`winget install Gyan.FFmpeg`) and the Playwright install command, and says to quote paths with spaces.
