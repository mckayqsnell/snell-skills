# Web apps

How to run steps 5 and 8 of the e2e-test skill on anything with a page. Commands are for `playwright-cli` 0.1 / Playwright 1.64; run `playwright-cli --help <command>` when one does not behave as written here.

## Pick the tool

Two tools drive the same Playwright engine. Use both freely, but **one browser at a time**: each holds its own Chromium in memory.

| Tool | Best for | Watch out |
|---|---|---|
| `playwright-cli` (shell) | Most of the run. Headless by default. Screenshots straight to a file you name, emulation commands (dark, reduced motion, offline), `requests` / `response-body`, `route` mocks, tracing, video, `run-code` for anything else. Every action prints the Playwright code it ran, ready for a spec. | It writes a `.playwright-cli/` folder (snapshots, logs) into the folder you run it from. Run it from a scratch folder, never the project root. |
| Playwright MCP (`browser_*` tools) | Quick looks inside the tool loop: `browser_snapshot`, `browser_take_screenshot` returns the image to you directly, `browser_console_messages`, `browser_network_requests`. | The stock plugin config starts a **visible** browser. Check its args (`claude mcp get playwright`, or the plugin's `.mcp.json`) for `--headless`. Without it, use `playwright-cli` unless the user wants to watch. It writes `.playwright-mcp/` in the working folder. |

If `playwright-cli` is not on the PATH, try `npx --no-install playwright cli`. Installing either tool or a browser needs the user's yes.

## Set up

```bash
SCRATCH="$(mktemp -d)"; cd "$SCRATCH"        # ledger: $SCRATCH
playwright-cli -s=e2e open http://localhost:3000   # ledger: session e2e
```

- **Run every `playwright-cli` command from `$SCRATCH`.** A session belongs to the folder it was opened from: from any other folder, `list` shows nothing and `close` says "not open" while the browser keeps running. Use absolute paths (`--filename="$SCRATCH/shots/x.png"`) so files land where you expect.
- Name every session (`-s=e2e`, or `-s=e2e-1`, `-s=e2e-2` for sub-agents). Other agents may run their own sessions: touch only your names.
- In zsh, a command stored in a variable does not split into words. Wrap it in a function instead: `P() { playwright-cli -s=e2e "$@"; }`.
- **Is the app already running?** `lsof -iTCP:<port> -sTCP:LISTEN -P` before you start it. If something already listens there, use it and leave it running: it is not on your ledger.
- **A static page or file:** `file://` URLs are blocked. Serve the folder: `python3 -m http.server 8765 --bind 127.0.0.1 -d <dir> &` and put its pid on the ledger.
- **Local HTTPS with a self-signed certificate** fails with `ERR_CERT_AUTHORITY_INVALID`. Write `{"browser":{"contextOptions":{"ignoreHTTPSErrors":true}}}` to `$SCRATCH/cli.json` and `open --config="$SCRATCH/cli.json" <url>`.

**Signing in**, best first:

1. A test login URL or seed user from the project (README, seed files, `.env.example`). Visit it, then `playwright-cli -s=e2e state-save "$SCRATCH/auth.json"` so later sessions start signed in with `state-load`.
2. **The user's real Chrome**, only when the app needs their real sign-in and there is no test login: `playwright-cli attach --extension=chrome --session=e2e-real`. It needs the Playwright Extension and reads its token from `PLAYWRIGHT_MCP_EXTENSION_TOKEN`; never print, echo or save that token. You are now in the user's own browser: open your own tab with `tab-new`, write down its index, and touch no other tab. Each attach leaves a "Playwright · playwright-cli" tab group in their Chrome; step 8 closes it.

Never type a real password. If neither way works, ask the user.

## Look at every view

For each screen in the plan, take this set and look at each image:

```bash
D="$SCRATCH/shots"; mkdir -p "$D"
playwright-cli -s=e2e resize 1280 800
playwright-cli -s=e2e set-color-scheme light
playwright-cli -s=e2e screenshot --filename="$D/export-light.png" --full-page
playwright-cli -s=e2e set-color-scheme dark
playwright-cli -s=e2e screenshot --filename="$D/export-dark.png" --full-page
playwright-cli -s=e2e set-color-scheme light
playwright-cli -s=e2e resize 390 844
playwright-cli -s=e2e screenshot --filename="$D/export-phone.png" --full-page
playwright-cli -s=e2e resize 1600 1000
playwright-cli -s=e2e screenshot --filename="$D/export-wide.png"
```

- Set `light` explicitly. `clear-color-scheme` goes back to the computer's own setting, which may be dark, so a "light" shot taken after it can be dark.
- `set-color-scheme dark` only changes `prefers-color-scheme`. If the app keeps its own theme (a toggle, a `data-theme`, a `theme` key in localStorage), check that the dark shot really is dark; if not, set that key in your own browser (`localstorage-set theme dark`, reload) rather than flip a setting the app saves on the server.
- Let the page settle before a shot: a short wait after a click, or `set-reduced-motion reduce`. A blank or half-drawn shot is usually mid-animation; retake it before you call it a bug.
- Phone: also check for side scroll: `playwright-cli -s=e2e --raw eval "document.documentElement.scrollWidth > innerWidth"` must print `false`.
- `open --device="iPhone 15"` gives a real phone (touch, user agent) when the app treats phones differently.
- Read an image with the Read tool to see it. Do this for every shot; a shot you did not look at is not evidence.

## Use it like a person

`playwright-cli -s=e2e snapshot` gives the page as an accessibility tree with refs (`e15`). Act on refs: `click e15`, `fill e7 "text" --submit`, `select`, `check`, `drag`, `upload`, `press Enter`. A big page: `find "Export"` searches the snapshot instead of printing it all.

- **Edges:** empty fields, 300-character names, emoji and `<script>` in text, double clicks on submit, back and forward, reload mid-flow.
- **Keyboard:** `press Tab` again and again, then `--raw eval "document.activeElement.outerHTML.slice(0,120)"` to see where focus is. Every control must be reachable, focus must be visible in the screenshot, Escape must close dialogs and menus.
- **Motion and contrast:** `set-reduced-motion reduce`, `set-contrast more` when the change has animation or subtle colors.
- **Dialogs:** `dialog-accept` / `dialog-dismiss`.

**One script per plan row.** Once you know the page, put a row's steps and checks in one file and run it in one call: `playwright-cli -s=e2e --raw run-code --filename="$SCRATCH/row3.js"`. The file holds `async page => { ... return JSON.stringify(results); }` and can use the full Playwright API: `page.getByRole`, `getByTestId`, `page.on('pageerror', …)`, `page.emulateMedia({ colorScheme: 'dark' })`, `page.setViewportSize`, `page.mouse` for drags, `page.screenshot({ path })`. This is far fewer round trips than one command per click, and the results come back as data. Relative paths in it resolve against `$SCRATCH`.

- Click what a person sees. A styled checkbox or toggle often has a span on top that "intercepts pointer events": click the visible control (its label or parent), not the hidden input, and do not reach for `force: true`.
- A test id file in the project (`testIds.ts`, `data-testid` in the components) makes stable locators: use it.

## Console and network, every page

```bash
playwright-cli -s=e2e console error          # errors only; warnings with: console warning
playwright-cli -s=e2e requests               # non-static requests, numbered
playwright-cli -s=e2e requests --filter "/api/"
playwright-cli -s=e2e request 4              # headers, body and response of #4
playwright-cli -s=e2e response-body 4
```

Any console error, or any 4xx or 5xx you did not cause on purpose, is a finding, even when the screen looks fine.

- The lists keep growing across page loads (a dev server can list thousands of source-module requests). Run `requests --clear` and `console --clear` before each step, and filter to the app's API (`--filter "/api/"`).
- **Whose error is it?** A console error with no source line often comes from a third-party script (analytics, tag manager). Block those hosts and reload: `run-code "async page => { await page.route(/googletagmanager|google-analytics|hotjar|segment/, r => r.abort()); await page.reload(); }"`. If the error goes away, it is not the app's code: report it as old and outside the change.

## Read-only runs

When the data is real, or another person or agent is using the same app, make writes impossible instead of just avoiding them:

```bash
playwright-cli -s=e2e run-code "async page => { await page.route('**/api/**', r => r.request().method() === 'GET' ? r.continue() : r.abort()); }"
```

Log what you blocked (record `r.request().method()` and the path in the handler). Plain page views often send writes too (usage counters, "most used", lock checks), so this list is itself worth a line in the report. Error toasts and failed states that follow a blocked request are caused by you, not findings.

**The app's own mock mode** is better still when it has one (a `?mock=1` flag, a fake backend, a `MOCK_` env var: search the transport or API client code). It lets you send messages, submit forms and see error states with nothing reaching the server. Then check in real mode, read-only, what you can: that the real responses have the same shape the mock returns. A mock that drifted from the real backend (a renamed field, an old option list) is a finding.

## Trace a click

Follow one user action all the way down:

1. **UI:** the screenshot after the click.
2. **Request:** `requests --filter "/api/"`, then `request <n>`: method, URL, status, request body, response body. Does the response match what the UI shows?
3. **Server log** (local backend only): the log file the project writes, or the output of the server you started. Find the line for that request; look for stack traces and warnings.
4. **Data** (local backend only, read-only): the row, file or queue message the action should have made. See `api.md` for read-only database and queue commands.

A remote backend (staging, a SaaS API): stop at step 2.

## Error states with mocks

Make the backend fail without touching it:

```bash
playwright-cli -s=e2e route "**/api/pipelines" --status=500 --body='{"error":"boom"}' --content-type=application/json
playwright-cli -s=e2e route "**/api/pipelines" --body='[]' --content-type=application/json     # empty state
playwright-cli -s=e2e network-state-set offline                                              # then: online
playwright-cli -s=e2e run-code "async page => { await page.route('**/api/slow', async r => { await new Promise(f => setTimeout(f, 4000)); await r.continue(); }); }"   # loading state
playwright-cli -s=e2e route-list
playwright-cli -s=e2e unroute                # remove every mock before the next row
```

Check that the UI says something useful for each: an error message, an empty state, a spinner that ends, a retry.

## Evidence for hard failures

- **Trace:** `tracing-start` before the steps, `tracing-stop` after; files land in `.playwright-cli/traces/`. Open with `npx playwright show-trace <file>` (it opens a window, so only when the user asks). Since 1.63 a trace can also hold an aria snapshot and a screenshot per action, which the trace viewer shows side by side: in a run-code script, `await page.context().tracing.start({ snapshots: { dom: true, aria: true, screen: true } })`, the steps, then `await page.context().tracing.stop({ path: 'bug-trace.zip' })`.
- **Video:** `video-start "$SCRATCH/bug.webm"`, the steps, `video-stop`. Worth it for a bug that needs timing to see.

## Turn flows into specs (only on a yes)

When the project has `playwright.config.*` and the user said yes:

1. Put the spec where the existing specs live, in their style (fixtures, helpers, naming).
2. Build it from the code `playwright-cli` printed for each action. Prefer `getByRole` / `getByLabel` / `getByTestId`; add `expect(...).toBeVisible()`, `toHaveText`, `toHaveURL`, and `toMatchAriaSnapshot` for a whole region. `locator.within(dialog)` (1.64) scopes a locator inside another.
3. Run only it: `PLAYWRIGHT_HTML_OPEN=never npx playwright test <file> --reporter=line`. Run it with `--repeat-each=3` (and `--shuffle` for a file of several tests, 1.64) to catch flakes.
4. A failing spec: `PLAYWRIGHT_HTML_OPEN=never npx playwright test <file> --debug=cli` in the background, then `playwright-cli attach <session it prints>` to explore the paused page. Stop the background run when done.

## Clean up and prove it

```bash
cd "$SCRATCH"                                # sessions belong to this folder
playwright-cli -s=e2e close                  # each session you opened, by name
playwright-cli -s=e2e-real tab-close <index> # the user's Chrome: only the tabs you opened
playwright-cli -s=e2e-real close             # ends the attach and its tab group
playwright-cli list                          # none of your session names left
ps aux | grep cliDaemon | grep -v grep       # no daemon left with your session names
kill <pid of each server you started>
rm -rf "$SCRATCH"                            # after moving the report and its shots out
```

`close-all` and `kill-all` end every session in that folder or on the machine, other agents' too: use them only when you know every session there is yours. If you used the MCP, call `browser_close` and delete the `.playwright-mcp/` folder it made. Check that neither `.playwright-cli/` nor `.playwright-mcp/` is left in the project: `git status --short` should show only the files the session meant to change.
