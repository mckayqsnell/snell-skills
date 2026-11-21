---
name: frontend-vibe
description: Interview the user about the feel of a frontend before anything is built, then pick 2-3 design sources that fit and write a build note a coding agent can follow. Use before any frontend build, or when the user says /frontend-vibe, "vibe check", "help me pick a look", "what should this feel like", or asks which UI library or effect to use.
---

# frontend-vibe

You find the feel of a frontend before anyone writes code. You grill the user, play the vibe back as a brief, pick 2 or 3 sources that fit it, and write a build note. You don't build the frontend yourself unless the user asks you to after the note is done.

The catalog is `references/catalog.md`. The build note template is `references/build-note.md`.

## 1. Interview

Ask **one question at a time**. Put your best guess after each one ("My guess: calm, like a good notebook app"), so the user can just say yes. Skip anything the user or the repo already answered: read the project's `package.json` and any design docs first.

Ask roughly in this order. Stop early once you have enough.

1. **What is it, and who is it for?** One sentence each. Who opens it, and when?
2. **Three sites or apps you love the feel of.** Any kind, not just this kind of product. For each one, ask what exactly they love: the type, the color, the motion, the way it's quiet?
3. **Calm or loud?** Ask for a number from 1 to 5.
4. **Serious or playful?** Also 1 to 5.
5. **What should feel touchable or alive?** Name the one thing people will remember: a card that tilts, a background that breathes, text that moves out of the way. If they say "everything", ask them to pick one.
6. **How much motion?** None, a little (hovers and fades), a lot (scroll scenes), or the whole page moves.
7. **Hard limits.** Stack, deadline (hours? weeks?), devices, speed budget, accessibility needs, brand colors or fonts they're stuck with.
8. **Anything that would make you hate it?** Looks they're sick of.

**Push back on vague answers.** "Clean", "modern", "sleek", "nice" and "minimal" aren't answers yet. Ask which kind: "Clean like Vercel's docs, or clean like a Muji catalog?" Offer two or three concrete options.

**Stop** when you can describe the feel in 3 or 4 sentences that rule things out, and every pick in step 3 is decided. That's usually 5 to 8 questions. Don't go past 10.

**Nobody to answer?** If you run as a sub-agent, in a script, or the user said "don't ask", use whatever brief you were given. Take your best guess for the rest, and mark each guess in the brief with "(guess)".

## 2. Vibe brief

Play it back in this form and ask the user to confirm or correct it:

```text
Feel: <3-4 sentences. What it's like to use it, in plain words.>
Dials: calm 2/5 · playful 4/5 · motion: a little · density: airy
Loved: <site> for <the exact thing>, <site> for <thing>, <site> for <thing>
The alive thing: <the one moment people will remember>
For: <who, on what device>
Limits: <stack, deadline, speed, accessibility, brand>
Not this: <looks to stay away from>
```

Don't move on until they say yes. Change the brief when they correct it, and show it again.

## 3. Pick

1. Read `references/catalog.md`. Start at **Route by vibe**: find the 1 or 2 families that match the dials, then read those sections.
2. Also look for the AI Builder Day team list (`AIBuilderDay/hackathon-resources`). Use a local clone if there is one; if not, try `gh api repos/AIBuilderDay/hackathon-resources/readme --jq .content | base64 --decode`. It's private, so skip it quietly if neither works. Anything in it that isn't in the catalog is fair game.
3. Pick **2 or 3 sources**: usually one base (a design system or component library) and one or two that make the alive thing. For each one, say why it fits the brief and where it shows up on the page.
4. **Mix, don't copy a recipe.** The family tables are starting points. Take one pick from a neighbouring family if it makes the page more itself. When two picks fit equally, don't default to the most famous one; pick on the brief and say why.
5. **Check each pick still works** before you name it: the link loads, the repo isn't archived, and the last release is under a year old. Say so in one line if one fails, and pick another.
6. **Nothing fits?** Search the web for well-maintained options (active repo, real docs, a license you can use). Label anything not in the catalog **new**, so the user knows it wasn't vetted.

Show the picks and let the user swap any of them before you write the note.

## 4. Build note

Copy `references/build-note.md` into the project as `design/vibe.md`, or wherever the user wants it, and fill it in. Keep it under a page. A coding agent should be able to build from it with no other context. It holds:

- The brief, word for word.
- The picks, with install lines you checked (`npm view <pkg> version` works).
- The tokens: 2 fonts, colors, corner radius, and spacing.
- Where each effect goes, section by section.
- The motion rules, including what happens with `prefers-reduced-motion`.
- **Avoid**: the generic-AI tells from the catalog, plus this user's own "not this" list.
- A **Check** list the builder runs before calling it done.

End by printing the path to the note and one line: "Hand this to the agent that builds it."
