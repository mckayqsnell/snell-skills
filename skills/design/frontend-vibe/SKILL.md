---
name: frontend-vibe
description: Interview the user about the feel of a new frontend before it is built, then pick 2-3 design sources that fit and write a build note a coding agent can follow. Use before building a new site, app or page with its own look, or a redesign, or when the user says /frontend-vibe, "vibe check", "help me pick a look", "what should this feel like", or asks which UI library or effect to use.
---

# frontend-vibe

You find the feel of a frontend before anyone writes code. You grill the user and play the vibe back as a brief. Then you pick 2 or 3 sources that fit it and write a build note. You don't build the frontend yourself unless the user asks you to after the note is done.

The catalog is `references/catalog.md`. The build note template is `references/build-note.md`.

**Skip it** when the change is small (a button, a form). Skip it too when the repo has a design system the work must follow. Say so in one line and stop.

## 1. Interview

Read the project first (`package.json`, any design docs). Don't ask what the repo already answers.

Ask **one question at a time**. Put a short guess after each one ("My guess: quiet, about a 2"), so the user can just say yes. Build the guess from their earlier answers, not from what most people would say. A specific guess that might be wrong beats a safe one.

Ask these 9, in this order. Skip any the user has already answered.

1. **What is it, and who is it for?**
2. **Where do they see it, and what's on it?** The screen matters: a laptop, a phone, a museum iPad, a projector. What's on it sets the density. Is it a few big things, or lots of small ones?
3. **Hard limits.** Ask about these six, because they rule picks out:
   - the stack, and who builds it
   - who edits it after launch, and where it lives (a repo, Shopify, a CMS)
   - devices
   - deadline
   - accessibility needs
   - money for paid tools

   Ask about sound, offline, print, shared data, light or dark, and brand only if earlier answers point there.
4. **Three sites, apps or things you love the feel of.** Any kind. Then ask what exactly they love about each: the type, the color, the motion, the quiet, the texture.
5. **Volume: 1 quiet to 5 loud.**
6. **Play: 1 serious to 5 playful.**
7. **The alive thing: what's the one moment people will remember?** It doesn't have to move. It can be a card you flip, a sound, a material, or a detail in the words.
8. **Motion: how much, and what kind?** None, a little, a lot, or the whole page. Gentle, snappy, bouncy or cinematic. "A lot, but gentle" is a fine answer.
9. **What would make you hate it?**

**Push back on vague answers.** "Clean", "modern", "fun", "nice", "simple" and "immersive" aren't answers yet. Give two or three concrete options: "Clean like Vercel's docs, or clean like a Muji catalog?" Push back at most twice per question, then write down your best reading.

**Borrow, don't clone.** When they love a famous site, find the one or two traits they mean ("the sharp grid"). The page should look like theirs, not like Vercel's.

**Stop** when you can sum up the feel in 3 or 4 sentences that rule things out. Every pick in step 3 should be clear by then.

**Nobody to answer?** Maybe you run as a sub-agent or in a script, or the user said "don't ask". Use the brief you were given. Guess the rest and mark each guess "(guess)". Skip every "wait for the user" step below, and keep the marks in the note.

## 2. Vibe brief

Play it back in this form:

```text
Feel: <3-4 sentences. What it's like to use it, in plain words.>
Dials: volume 2/5 (quiet) · play 4/5 (playful) · motion: a little, snappy · density: airy
Loved: <site> for <the exact thing>, <site> for <thing>, <site> for <thing>
The alive thing: <the one moment people will remember>
For: <who, on what screen>
Limits: <the ones that apply>
Not this: <looks to stay away from>
```

List every "(guess)" under it in one message: "I guessed these. Fix any that are wrong." A guess the user can't answer stays marked "(default)", not "confirmed". Wait for a yes. When they correct it, show the brief again.

## 3. Pick

1. Read **Route by vibe** in `references/catalog.md`. Choose 1 or 2 families from what the user loves: the loved things and the alive thing. Then check them against the dials. Then read only the catalog rows that name those families.
2. If the user has the AI Builder Day team list (`AIBuilderDay/hackathon-resources`, a local clone or `gh api repos/AIBuilderDay/hackathon-resources/readme --jq .content | base64 --decode`), read it too. Treat its items like catalog items. If you can't reach it, skip it quietly.
3. Apply the limits first. Cross out what the stack, builder, devices, budget or license rule out.
4. Pick **2 or 3 sources**: usually one base and one for the alive thing. The alive thing may need no library at all (a CSS trick, a type detail, the words, speed). When that fits, prefer it. For each pick, say why it fits and where it shows up.
5. **Make it theirs.** Would anyone with these dials get this exact set? If yes, swap one piece for something of this user's: a loved site, the alive thing, their own handwriting, photos or data. The owner's own stuff beats any library. For a volume 1, play 1 brief, make a detail more exact instead of adding anything.
6. **Vary on purpose.** First cross out what the brief decided. If two options still fit equally (two serifs, two shaders), pick one at random (`echo $((RANDOM % 2))`) and say it was a toss-up.
7. **Check each pick.** The link loads and the repo isn't archived. It's active (a release in the last year) or clearly finished. Fonts and plain CSS can be finished. If the note will name a component or effect, check that it exists in the current docs.
8. **Nothing fits?** Search the web for well-kept options (active repo, real docs, a license you can use). Label anything not in the catalog or team list **new**.

Show the picks and let the user swap any of them. Then write the note.

## 4. Build note

Copy `references/build-note.md` to `design/vibe.md` in the project, or wherever the user wants it. Fill it in, and replace every `{{…}}`: `grep -n '{{' design/vibe.md` must print nothing. Keep it to about 800 words plus the brief, in bullets. Cut adjectives, not decisions. A coding agent should be able to build from it with nothing else.

- Put the brief in word for word, with any "(default)" marks.
- Check install lines with `npm view <pkg> version`.
- Check every text color against its background for WCAG AA.
- Fill the Avoid list with the user's "not this" answers. Add the 3 or 4 tells from the catalog's **Generic-AI tells** this page could fall into.
- Make the Check list fit their screens and limits.

End by printing the path to the note and one line: "Hand this to the agent that builds it."
