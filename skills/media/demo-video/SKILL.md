---
name: demo-video
description: Make a polished, hands-free demo video of an app the user built, with a smooth drawn cursor, punch-in zooms, captions, title and end cards, and optional music. Use when the user says /demo-video, "make a demo video", "record a walkthrough" or "show off this app". Takes an optional length ("3 minutes", "2 to 5 minutes") and "vertical".
---

# demo-video

You make a demo video of the user's app with no hands on the mouse. A script drives a real browser like a person, records clean takes with no OS cursor, and logs every move. The edit plays the app full-screen, draws its own smooth cursor and aims gentle zooms from that log. Two critics review the cut before the user sees it.

**This skill's folder** holds `scripts/` (copied into each video's workspace), `platforms/` (the tools for each kind of app) and `references/` (the edit and the review). Use its full path when you run commands from elsewhere.

**Tell the user up front, in one line:** a demo video takes a while and uses a fair number of tokens (recording, rendering, and two critic sub-agents).

## 1. Check the tools

| Tool | Check | If missing |
|---|---|---|
| ffmpeg | `ffmpeg -version` | Ask, then `brew install ffmpeg` (macOS) or the system package. |
| Playwright | `node <skill>/scripts/find-playwright.mjs` from the app's folder prints a path | Ask before installing anything. `@playwright/cli` globally is the lightest. |
| HyperFrames | the `hyperframes:hyperframes` skill is listed | Suggest `claude plugin marketplace add heygen-com/hyperframes`, then `claude plugin install hyperframes@hyperframes`. Until then, offer **Quick** mode. |

**Full** mode (HyperFrames) is the default: zooms, captions, cards and sound in a real edit. **Quick** mode uses only Playwright's own cursor, chapter cards and overlays plus ffmpeg: plainer, faster, no plugin.

## 2. Line up with the user

Ask before you record. Scale the questions to the app: 2–3 for a small app, more for a big one, and for a big one suggest the `grilling` skill. Ask in one round with your suggested answer for each. Skip any question the call or the repo already answers.

- **Length.** Given in the call: it wins. Plain call: add up how long each feature takes to show (3–6 s for a click-and-see feature, 10–20 s for a hero flow that builds something) plus about 8 s of title and end cards, and cap it at 2.5 min. A small app honestly lands at 30–45 s; don't pad it. Ask only when the app has more than 8 features worth showing.
- **Who watches,** and what they should think at the end (one sentence; it becomes the goal line in `SPEC.md`).
- **Music** (opt-in, always ask): none; a track from HeyGen's catalog (needs a free HeyGen sign-in); a free track from Pixabay the user downloads; or a generated one. Soft UI sounds on clicks and keys are on either way, unless the user wants silence.
- **Must show, must hide:** features, screens or data that must or must not appear.
- **Sign-in:** only if you could not find a test login, seed or reset command in the repo.
- **Shape:** 1920×1080 at 60 fps by default; `vertical` gives 1080×1920.

## 3. Read the platform file

Work out what the app is, then read only its file:

- **Web app** (a page in a browser, local or deployed): [`platforms/web.md`](platforms/web.md).
- **Anything else** (iPhone, desktop, a CLI): no platform file yet. Say so, and offer to record what has a web face. An iPhone file would use Claude's iOS Simulator tool.

## 4. Find the features

Explore the running app live (the platform file names the tools). Read the README, routes, nav and recent commits for what the app is proud of. A hosted app with no repo: explore it live only. Host chrome that isn't the app (a "this is a demo" bar, a cookie banner) may be hidden with an injected style; say so in `SPEC.md`. Write a ranked feature list into `SPEC.md`: what each one does for the viewer, where it lives, and how long it takes to show.

Rank by what makes a viewer lean in: the one moment that looks like magic first, then the core job the app exists for, then what sets it apart. Cut what the length can't hold. A feature that needs a long wait gets shown at speed, not dropped. Check that the demo data tells the story the goal line claims: a "bulk export" demo where half the rows fail, or a dashboard with one row, undercuts it. Fix the seed or pick other records before you record.

**Real or test data?** Judge it as you explore. Seed data, demo accounts and obvious fakes are fine. If it looks like real customers (real names, emails, amounts, a production host), stop and ask before you record.

## 5. Write the story and the shot list

In the workspace (step 6 makes it):

1. `STORYLINES.md`: 3 short storylines that are different films, each with its first 2 seconds. Pick one and say why. Don't stop for the user unless they asked to pick.
2. `SPEC.md`: the goal line, the look (the app's own colors, fonts and logo, read from its code), then the **shot list**: one row per beat with its time, what the take does, the caption, and every **zoom target**. A zoom target names a thing on screen: typing into a chat zooms on the input, an answer zooms on the answer, a result zooms on the result. Each one becomes a `rec.box()` in the scene script, so the camera frames real pixels.

Open on the strongest moment, not on an empty form. End on a claim and an end card.

## 6. Record the takes

1. Make the workspace next to the repo, `<parent of repo>/<repo>-demo-video/`. `node <skill>/scripts/setup.mjs <app-repo> [name] --print-path` prints it (`[name]` overrides the folder name). A hosted app with no repo: pass the folder it should go in and a name (`setup.mjs ~/Videos <app>-demo-video`). Full mode: run `init` on that path first (the exact command is in [`references/hyperframes.md`](references/hyperframes.md) "Set up"), then `node <skill>/scripts/setup.mjs <app-repo>`. Quick mode: just `setup.mjs`. It never overwrites files.
2. Write `recorder/scenes.mjs` from `recorder/scenes.example.mjs` and the shot list. Before the long take, run a 10 s test take of the trickiest beat and check its marks and boxes arrived in `raw/<clip>.events.json`. Prefer **one long take** through the whole story: the edit then moves the camera between beats instead of hard-cutting, and the app's state carries over.
3. Run it: `node recorder/scenes.mjs story`. It prints the engine, frame width, frames and marks.
4. **The take passes** when `raw/<clip>.events.json` shows `frameWidth` 3200 (for a 1280-wide page at 2.5×), every mark you expected, and no `timeout` mark. Then look at a contact sheet: `node recorder/sheet.mjs raw/story.mp4 sheets/story.png 0 <end> 1 6 320`. A wrong screen, a stuck spinner or an error toast means a retake, not a fix in the edit. A `missing-box` mark means a zoom target matched nothing: fix the locator and retake.

## 7. Cut, then compose

- **Cut:** `node recorder/cut.mjs story story-cut "0-4.5@1,4.5-20@6,20-31@1,31.2~0.5"`. Waiting runs at 3–6× (faster reads as a glitch); the hero action and anything the viewer reads runs at 1×, and a beat the viewer must read gets at least 2 s on screen; `t~hold` freezes a frame (under a zoom-through, so the pressed button stays on screen). The cut writes the clip and the event log with its times moved to match.
- **Sound:** `node recorder/sfx.mjs story-cut` places key ticks and clicks on the right frames. Animation impacts: find the real frame with `node recorder/peaks.mjs`; DOM signals often fire early.
- **Compose:** Full mode → [`references/hyperframes.md`](references/hyperframes.md). Quick mode → [`references/quick.md`](references/quick.md).

## 8. Review with two critics

Follow [`references/critics.md`](references/critics.md): two critic sub-agents (motion and timing; story and clarity), a third only for videos over 2 minutes. Fix every P0 and P1, re-render, and run the critics again. Stop after 2 fix rounds and list what is left.

## 9. Hand over and clean up

1. Give the user the MP4 path, a contact sheet of the whole video, the length, and one line on the storyline you picked. Offer the HyperFrames desktop app for edits (Full mode).
2. Clean up, even when a step failed: `node recorder/cleanup.mjs` closes this run's browser sessions and deletes scratch (frame folders, `sheets/`, `review/scratch/`, HyperFrames snapshots, anything you listed with `--add-scratch`). Stop any server you started, and the HyperFrames preview unless the user is editing in it (`npx hyperframes preview --stop`). Close every tab you opened in the user's Chrome. Close only what this run opened: another project's preview or server stays.
3. Ask before deleting anything worth running again: the scene script, raw takes and the composition stay unless the user says so.
