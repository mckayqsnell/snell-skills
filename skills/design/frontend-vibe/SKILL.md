---
name: frontend-vibe
description: Interview the user about the feel of a frontend before anything is built, then pick 2-3 design sources that fit and write a build note a coding agent can follow. Use before any frontend build, or when the user says /frontend-vibe, "vibe check", "help me pick a look", "what should this feel like", or asks which UI library or effect to use.
---

# frontend-vibe

You find the feel of a frontend before anyone writes code. You grill the user, play the vibe back as a brief, pick 2 or 3 sources that fit it, and write a build note. You don't build the frontend yourself unless the user asks you to after the note is done.

The catalog is `references/catalog.md`. The build note template is `references/build-note.md`.

## 1. Interview

Read the project first (`package.json`, any design docs). Don't ask what the repo already answers.

Ask **one question at a time**. Put a short guess after each one, one or two sentences ("My guess: quiet, about a 2"), so the user can just say yes. Build the guess from their earlier answers, not from what most people would say. A specific guess that might be wrong beats a safe one.

Ask these 8, in this order. Skip or fold in any the user has already answered:

1. **What is it, who is it for, and where do they see it?** One sentence each. The screen matters: laptop, phone from Instagram, museum iPad, a projector. Also: what's on it? A few big things or lots of small ones (text, images, video, live data)? That answer sets the density dial.
2. **Hard limits.** Give a checklist and let them tick it: stack and who builds it (a React dev? someone who knows basic HTML?), where it will live (a repo, Shopify, a CMS), deadline, devices and browsers (old iPads?), touch or keyboard, speed, accessibility and the users' age or reading level, light or dark, saved or shared data (and whether people log in), sound, offline, print, money for paid tools, brand colors or fonts they're stuck with. These come early because they rule picks out.
3. **Three sites, apps or things you love the feel of.** Any kind, not just this kind of product. Then ask what exactly they love about each: the type, the color, the motion, the quiet, the texture.
4. **Volume: 1 quiet to 5 loud.**
5. **Play: 1 serious to 5 playful.**
6. **The alive thing: what's the one moment people will remember?** It doesn't have to move. It can be a card you flip, something that answers your touch, a sound, a material (paper, metal, felt), or text that gets out of the way. If they say "everything", ask them to pick one.
7. **Motion: how much, and what kind?** Amount: none, a little, a lot, or the whole page. Kind: gentle, snappy, bouncy, or cinematic. "A lot, but gentle" is a fine answer.
8. **What would make you hate it?** Looks they're sick of.

**Push back on vague answers.** "Clean", "modern", "sleek", "fun", "nice", "simple" and "immersive" aren't answers yet. Ask which kind, with two or three concrete options: "Clean like Vercel's docs, or clean like a Muji catalog?" Follow-ups and push-backs don't count against the 8, but stop after 2 on any one question and write down your best reading.

**Borrow, don't clone.** When they love a famous site, find the one or two traits they mean ("the sharp grid", "the calm changelog"). Don't take the whole system: the page should look like theirs, not like Vercel's.

**Stop** when you can describe the feel in 3 or 4 sentences that rule things out, and every pick in step 3 is decided. If you get there early, skip what's left.

**Nobody to answer?** If you run as a sub-agent, in a script, or the user said "don't ask", use whatever brief you were given. Take your best guess for the rest, and mark each guess in the brief with "(guess)".

## 2. Vibe brief

Play it back in this form and ask the user to confirm or correct it:

```text
Feel: <3-4 sentences. What it's like to use it, in plain words.>
Dials: volume 2/5 (quiet) · play 4/5 (playful) · motion: a little, snappy · density: airy
Loved: <site> for <the exact thing>, <site> for <thing>, <site> for <thing>
The alive thing: <the one moment people will remember>
For: <who, on what screen>
Limits: <stack and builder, deadline, devices, input, speed, accessibility, sound, offline, print, budget, brand>
Not this: <looks to stay away from>
```

Ask about every "(guess)" by name: "I guessed X for your deadline. Right?" Don't move on until they say yes. When they correct it, change the brief and show it again.

## 3. Pick

1. Read `references/catalog.md`. Start at **Route by vibe**. Find the 1 or 2 families by what the user loves first (the loved things and the alive thing), then check them against the dials. Read those families' rows.
2. Also look for the AI Builder Day team list (`AIBuilderDay/hackathon-resources`). Use a local clone if there is one; if not, try `gh api repos/AIBuilderDay/hackathon-resources/readme --jq .content | base64 --decode`. It's private, so skip it quietly if neither works. Anything in it that isn't in the catalog is fair game.
3. Apply the limits first. Cross out anything the stack, builder, devices, budget or license rules out. Don't hand a React kit to someone who knows only basic HTML.
4. Pick **2 or 3 sources**: usually one base and one or two that make the alive thing. For each, say why it fits the brief and where it shows up on the page.
5. **Make it theirs.** Ask yourself: would anyone with these dials get this exact set? If yes, swap one piece for something tied to this user's own answers: a loved site, the alive thing, a material. The owner's own stuff (their handwriting, their photos, their real data) beats any library. Borrowing from a neighbouring family is often the way. Stay inside the dials: a quiet, serious brief gets a more exact detail, not an effect.
6. **Vary on purpose.** When two or more options fit the brief equally (two serifs, two shader effects), pick one at random and say it was a toss-up, naming the other. Two runs on the same brief should land in the same family with different details. Never randomize anything the brief decided.
7. **Check each pick still works**: the link loads, the repo isn't archived, and it's either active (a release in the last year) or clearly finished and stable. Fonts and plain CSS can be finished. If the note will name a specific component or effect (a side panel, a `Water` shader), check it exists in the current docs or package, not just in a blog post. Say in one line if one fails, and pick another.
8. **Nothing fits?** Search the web for well-maintained options (active repo, real docs, a license you can use). Label anything not in the catalog **new**, so the user knows it wasn't vetted.

Show the picks and let the user swap any of them before you write the note.

## 4. Build note

Copy `references/build-note.md` into the project as `design/vibe.md`, or wherever the user wants it, and fill it in. **About 800 words, plus the brief**: bullets, not paragraphs. Cut adjectives, not decisions. A coding agent should be able to build from it with no other context. It holds the brief word for word, the picks with checked install lines (`npm view <pkg> version`), the tokens (with every text color checked for contrast), where each effect goes, the motion rules, the limits that change the build, an Avoid list and a Check list.

Fill the Avoid list with this user's "not this" answers plus the 3 or 4 tells from the catalog's **Generic-AI tells** that this page is most likely to fall into. Make the Check list fit their screens and limits, not a stock list.

End by printing the path to the note and one line: "Hand this to the agent that builds it."
