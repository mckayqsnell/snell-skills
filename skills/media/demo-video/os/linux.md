# Linux

Setup for Linux, including WSL and containers. `check-setup.mjs` sent you here; fix what it marked `MISSING`, then go back to `../SKILL.md` step 2.

## Install what's missing

Ask the user before you install anything. A fix line that starts with `sudo` needs root. If `sudo -n true` works, run it. If sudo asks for a password, give the user the exact command to run themselves (in Claude Code they can type `! <command>`), and wait. If you're already root (common in a container), the check leaves `sudo` off. If there's no `sudo` and you aren't root, ask the user to run the line as root.

| Missing | Install |
|---|---|
| ffmpeg | The fix line from `check-setup.mjs` (for example `sudo apt-get install -y ffmpeg` on Ubuntu and Debian). It also needs the `libx264` encoder: Fedora's own `ffmpeg-free` lacks it, so enable RPM Fusion and swap in its `ffmpeg`. |
| playwright | `npm install -g @playwright/cli`. If npm's global folder needs root, use the app's own Playwright, or set `npm config set prefix ~/.npm-global` and add `~/.npm-global/bin` to PATH. |
| browser, not installed | `playwright-cli install-browser chromium`, as the user, not with sudo: the browser goes in the user's own cache. |
| browser, missing libraries | The fix line from `check-setup.mjs`. It runs Playwright's own `install-deps` as root for the system libraries only (it uses apt, so Ubuntu and Debian). On another distro, install the library the line names with its package manager. |
| hyperframes-browser (ARM only, Full mode only) | Google has no Chrome download for Linux on ARM, so HyperFrames can't fetch one. It doesn't block `ready: yes`, since recording and Quick mode don't need it. For Full mode, use Playwright's Chromium: run the `export HYPERFRAMES_BROWSER_PATH=…` line from `check-setup.mjs` in the same command as each `npx hyperframes` call (each command starts a fresh shell). |

Run `node <skill>/scripts/check-setup.mjs` again until it prints `ready: yes`.

## Good to know

- Google Chrome exists only for x86-64 Linux. On ARM (a Raspberry Pi, a Graviton server, Docker on an Apple Silicon Mac) the recorder uses Playwright's Chromium, and frames come out the same.
- Nothing needs a screen: recording, sheets and renders all run headless, so a server or a container works.
- Alpine and other musl distros can't run Playwright's browsers. Use a Debian or Ubuntu image.
- **In Docker:** Playwright starts Chromium with `--disable-dev-shm-usage`, so the small default `/dev/shm` is fine. As root, Chromium runs without its sandbox (Playwright's default). The MP4 lands in the container: tell the user where, or record into a mounted folder.
- **In WSL:** keep the workspace on the Linux side (`~/…`), not under `/mnt/c`; files there are slow. Show the result with `explorer.exe .` from the renders folder. An app running on Windows is reachable from WSL at `localhost` only with mirrored networking (`networkingMode=mirrored` in `%UserProfile%\.wslconfig`); otherwise run the app inside WSL too.
- Show the user the result with `xdg-open renders/<app>-demo.mp4` on a desktop, or give the path.
