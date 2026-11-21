# Catalog

Sources the frontend-vibe skill picks from. Each one was checked in November 2026: the link loads, the repo is active and not archived, and the npm name is real. Check again before you hand one off (SKILL.md, step 3).

"Agent docs" means the source publishes Markdown made for agents: an `llms.txt`, or pages that work with `.md` added to the URL. Point the builder at those docs; they read better than scraped HTML.

## Route by vibe

Find the 1 or 2 families closest to the brief's dials. Then read their rows in the sections below. These are starting points, not recipes: borrowing one pick from a neighbouring family is how a page stops looking like a template.

| Family | Dials | Base | Alive thing candidates | Type direction |
| :- | :- | :- | :- | :- |
| **Quiet tool**: black and white, precise, fast | volume 1-2, play 1-2 | Geist look on shadcn/ui, Kumo, Base UI, coss ui; Astro or Starlight for static sites and docs | Real code or terminal output (Shiki, Expressive Code), Paper Shaders Dithering or Dot Grid, cobe globe, View Transitions | Geist Sans + Mono, IBM Plex, Inter |
| **Editorial**: led by type, reads like a magazine | volume 1-3, play 1-3 | Plain CSS + Open Props, or Astro | Pretext text wrapping around shapes, GSAP SplitText, Lenis scroll | A real serif (Fontshare, Collletttivo, Velvetyne) + a quiet sans |
| **Archive and print**: keepsakes, recipes, collections | volume 1, play 1-3 | Plain HTML and CSS, no build step | A CSS 3D card flip, a zoomable scan, paper texture (Paper Shaders Paper Texture), a print stylesheet | A book serif + a typewriter or hand face |
| **Warm and cozy**: friendly, soft, easy | volume 2-3, play 3-4 | Radix Themes, HeroUI, Mantine, or plain CSS | Motion springs, Auto Animate lists, soft sounds (Tone.js, Howler), a Rive character | A rounded or humanist sans (Fontshare), Phosphor icons |
| **Toy box**: tactile, bouncy, makes you poke it | volume 3-5, play 4-5 | neobrutalism.dev, React Bits, or plain CSS | Pokemon Cards CSS foil, Atropos tilt, Matter.js physics, Rough.js sketch lines, sound | A chunky display face + mono |
| **Zine and collage**: DIY, photocopied, stickers and tape | volume 4-5, play 3-5 | Plain HTML and CSS | Things you drag and stack (Matter.js), torn-paper SVG edges, photocopy grain (CSS filters + SVG noise), a Wrapped-style story of your own stats | A condensed grotesk + a typewriter face |
| **Cinematic**: the page is the show | volume 4-5, any play | Almost none: a few plain controls | ShaderGradient, Spark splats, Canvas UI, Paper Shaders, Unicorn Studio, GSAP ScrollTrigger + Lenis | One big display face, used huge |
| **Retro OS and games**: nostalgia, joke-friendly | play 4-5 | 98.css, 7.css, XP.css, NES.css, 8bitcn | Sounds, pixel art, CRT or VHS effect (Canvas UI VHS) | Geist Pixel, Departure Mono, system fonts |
| **AI chat**: talk to a model | volume 2-3, play 1-3 | AI Elements or assistant-ui on shadcn/ui | Streaming text, thinking states (prompt-kit, Beautiful UI) | Geist or Inter + a mono for tool output |
| **Live ops**: watch things run (agents, builds, servers) | volume 2-3, play 1-2 | Kumo, shadcn/ui, or Mantine; dark is fine | Many streams at once (TanStack Virtual), diffs (git-diff-view, diff2html), a finish moment with Motion | A condensed sans + a mono (IBM Plex Sans Condensed + Mono) |
| **Dense data**: tables, admin, reports | volume 1-2, play 1 | Carbon, Primer, Fluent 2, Mantine, Ant Design | Speed and clarity are the feel. One live sparkline at most. | IBM Plex or the system's own |

## Bases: design systems and component libraries

| Source | Gives you | Families | Stack, install, notes |
| :- | :- | :- | :- |
| [Vercel Geist](https://vercel.com/geist) | The black-and-white Vercel look: colors, type, grid, materials. | Quiet tool, AI chat | Agent docs (`.md` on any page). The React package isn't public, so take the tokens and font and build on shadcn/ui. Borrow the look, never the logo or brand. |
| [Geist font](https://vercel.com/font) | Geist Sans, Mono, Serif and Pixel. | Quiet tool, AI chat, Retro | `npm i geist`, or Google Fonts. OFL. |
| [Cloudflare Kumo](https://kumo-ui.com) | Cloudflare's product UI: accessible React components on Base UI, blocks, light and dark tokens, a command palette, and a way to render AI-made UI from JSON. | Quiet tool, Live ops, Dense data | Agent docs. `pnpm add @cloudflare/kumo @phosphor-icons/react`; `npx @cloudflare/kumo doc Button` prints docs. MIT. It doesn't stream text or logs for you. |
| [shadcn/ui](https://ui.shadcn.com) | Copy-in React components that you own. The base most libraries below build on. | Most React | Agent docs. Restyle it: the stock zinc colors and radius are the biggest AI tell there is. MIT. |
| [Astro](https://astro.build) | Static sites that ship almost no JS. Use any of the React or plain-JS picks as islands. | Quiet tool, Editorial | `npm create astro@latest`. MIT. |
| [Starlight](https://starlight.astro.build) | Astro's docs theme: search, sidebar, dark mode, good code blocks. | Quiet tool | `npm create astro@latest -- --template starlight`. MIT. Restyle it or it looks like every other Starlight site. |
| No framework | Modern CSS alone: custom properties, `:has()`, container queries, `clamp()`. | Archive, Editorial, Zine, Retro | Nothing to install. Often the right call for a builder who knows only HTML and CSS. |
| [Web Awesome](https://webawesome.com) | Accessible web components (dialog, tabs, inputs) that drop into plain HTML with no build step. | Warm and cozy, Archive, Quiet tool | Agent docs. `npm i @awesome.me/webawesome` or a CDN link. MIT core; some components are Pro (paid). |
| [Open Props](https://open-props.style) | Ready CSS variables for color, type, space, easing and shadows. No framework. | Editorial, Archive, Warm | `npm i open-props`, or one CSS link. MIT. Good for builders who only know HTML and CSS. |
| [Base UI](https://base-ui.com) | Unstyled, accessible React parts. Bring all of the look yourself. | Quiet tool, Editorial | Agent docs. `npm i @base-ui/react`. MIT. |
| [coss ui](https://coss.com/ui) | Cal.com's design system: crisp, neutral, shadcn-style. | Quiet tool | Agent docs. MIT. |
| [Radix Themes](https://www.radix-ui.com/themes) | Styled React components with real theme knobs (radius, scale, accent). | Warm and cozy | `npm i @radix-ui/themes`. MIT. |
| [HeroUI](https://www.heroui.com) | Soft, rounded, friendly React components. | Warm and cozy | Agent docs. `npm i @heroui/react`. Apache-2.0. |
| [Mantine](https://mantine.dev) | A huge React kit: forms, dates, charts, hooks. | Warm and cozy, Dense data | Agent docs. `npm i @mantine/core`. MIT. |
| [IBM Carbon](https://carbondesignsystem.com) | Strict, dense, enterprise. Great tables and data viz. | Dense data | Agent docs. `npm i @carbon/react`. Apache-2.0. |
| [GitHub Primer](https://primer.style) | GitHub's UI: plain, dense, developer-y. | Dense data, Quiet tool | `npm i @primer/react`. MIT. |
| [Fluent 2](https://fluent2.microsoft.design) | Microsoft's system, for apps that sit next to Office or Teams. | Dense data | `npm i @fluentui/react-components`. |
| [Ant Design](https://ant.design) | Big enterprise React kit, strong on admin screens. | Dense data | `npm i antd`. MIT. Easy to spot, so restyle it. |
| [neobrutalism.dev](https://neobrutalism.dev) | Thick borders, hard shadows, loud flat color, on shadcn. | Toy box | MIT. |
| [98.css](https://jdan.github.io/98.css), [XP.css](https://botoxparty.github.io/XP.css/), [7.css](https://khang-nd.github.io/7.css/) | Old Windows looks in plain CSS on plain HTML. | Retro | `npm i 98.css` and so on. MIT. Finished projects, slow to change. |
| [NES.css](https://nostalgic-css.github.io/NES.css/), [8bitcn](https://www.8bitcn.com) | 8-bit game UI. NES.css is plain CSS; 8bitcn is shadcn. | Retro | MIT. NES.css hasn't changed since 2024: fine for CSS, but test it. |

## Components: animated and copy-in

| Source | Gives you | Families | Stack, install, notes |
| :- | :- | :- | :- |
| [React Bits](https://reactbits.dev) | Big set of animated text, backgrounds and parts. | Toy box, Cinematic | Agent docs. React. MIT + Commons Clause: use it, don't resell it. |
| [Magic UI](https://magicui.design) | Landing-page motion parts: tickers, marquees, beams, globes. | Quiet tool, Cinematic | Agent docs. shadcn registry. MIT. Popular, so tune it or it looks familiar. |
| [Aceternity UI](https://ui.aceternity.com) | Flashy hero and card effects. | Cinematic | Free parts plus a paid Pro set. Very common in AI-made sites: use one piece at most. |
| [Motion Primitives](https://motion-primitives.com) | Small, tasteful Motion parts. | Quiet tool, Warm and cozy | shadcn registry. MIT. |
| [Animata](https://animata.design), [Cult UI](https://www.cult-ui.com) | Playful animated parts and odd widgets. | Toy box, Warm and cozy | MIT. |
| [Rare UI](https://rareui.com), [beUI](https://beui.dev) | Unusual animated buttons, cards and text effects. | Toy box | shadcn and Tailwind. From the team list. |
| [Beautiful UI](https://beautifului.dev) | Streaming text, thinking states, approval cards, agent screens. | AI chat, Live ops | From the team list. Scripted demos: copy the pattern, don't expect a package. |
| [AI Elements](https://elements.ai-sdk.dev) | Vercel's chat and agent parts for the AI SDK. | AI chat | Agent docs. shadcn registry. Apache-2.0. |
| [assistant-ui](https://www.assistant-ui.com) | A full chat UI kit that works with any model backend. | AI chat | `npm i @assistant-ui/react`. MIT. |
| [prompt-kit](https://prompt-kit.com) | Small AI parts: prompt box, message, reasoning, loader. | AI chat | shadcn registry. MIT. |
| [threeui](https://threeui.com/browse), [GetLayers](https://www.getlayers.ai) | 3D page templates and scenes you copy as prompts. | Cinematic | From the team list. |

## Effects, shaders and 3D

| Source | Gives you | Families | Stack, install, notes |
| :- | :- | :- | :- |
| [Paper Shaders](https://shaders.paper.design) | Fast, light shader backgrounds: mesh gradient, grain, dithering, dot grid, liquid metal, halftone, water, paper texture. | Quiet tool, Cinematic, Editorial, Archive | Agent docs. `npm i @paper-design/shaders-react`, or `@paper-design/shaders` with no framework. Apache-2.0. The best first pick for "make the background alive". They play on their own; wire up pointer input yourself if it should react. Some (Water, Image Dithering) need an image. Colors must be hex, rgb or hsl, not `oklch()`. |
| [ShaderGradient](https://www.shadergradient.co) | Grainy, slow, 3D moving gradients. | Cinematic, Warm and cozy | `npm i @shadergradient/react`. Tune one at shadergradient.co/customize and paste the URL in. MIT. |
| [Canvas UI](https://canvasui.dev) | Shaders over live, clickable HTML: liquid, glass, frost, shatter, VHS, particle reveal. | Cinematic, Toy box | Agent docs. shadcn registry for React, Vue, Svelte, vanilla. Most effects need Chrome 157+; Firefox, Safari and Android get a plain fallback, so never hide content behind it. MIT + Commons Clause. |
| [Spark](https://sparkjs.dev) | Gaussian splats in three.js: real 3D scans you can dissolve and morph. | Cinematic | `npm i @sparkjsdev/spark three`. MIT. Heavy: one scene per page. |
| [three.js](https://threejs.org) | The 3D engine under most of this. | Cinematic | Agent docs. `npm i three`. MIT. |
| [React Three Fiber](https://r3f.docs.pmnd.rs) + [drei](https://drei.docs.pmnd.rs) | three.js as React parts, plus ready-made helpers. | Cinematic | `npm i @react-three/fiber @react-three/drei three`. MIT. |
| [Unicorn Studio](https://www.unicorn.studio) | Make WebGL scenes in a no-code editor, then embed them. | Cinematic | Hosted tool with a free tier. Good when the deadline is hours. |
| [Spline](https://spline.design) | Design 3D scenes in the browser, then embed them. | Cinematic, Warm and cozy | Hosted tool. Embeds can be heavy on phones. |
| [Pokemon Cards CSS](https://poke-holo.simey.me) | Holographic foil cards that tilt and shine. | Toy box | Copy the CSS from [the repo](https://github.com/simeydotme/pokemon-cards-css); a little JS tracks the pointer. GPL-3.0: check that this fits the project. |
| [Atropos](https://atroposjs.com) | 3D parallax tilt on hover or touch. | Toy box, Warm and cozy | `npm i atropos`. MIT. Done and stable, last release 2023. |
| [Matter.js](https://brm.io/matter-js) | 2D physics: things you can throw, stack and knock over. | Toy box, Zine | `npm i matter-js`. MIT. Finished and stable (last release 2024). |
| [cobe](https://cobe.vercel.app) | A tiny WebGL dotted globe. | Quiet tool | `npm i cobe`. MIT. 5 kB. |
| [Rough.js](https://roughjs.com) | Hand-drawn, sketchy lines and shapes. | Toy box, Editorial, Zine | `npm i roughjs`. MIT. Done and stable. Often picked: check it is the right hand-made look, not just the first one. |
| [perfect-freehand](https://perfectfreehand.com) | Smooth, pressure-shaped pen strokes: signatures, doodles, things people draw. | Toy box, Archive, Zine | `npm i perfect-freehand`. MIT. |
| SVG wobble filter | `feTurbulence` + `feDisplacementMap` make any line or frame boil like hand-drawn animation. | Toy box, Zine, Retro | No library. Change the filter seed a few times a second for a boiling-line look. |
| [tsParticles](https://particles.js.org) | Particles, confetti, fireworks. | Toy box | `npm i @tsparticles/slim`. MIT. Use for one moment (a win), not a background. |
| [p5.js](https://p5js.org) | Creative coding for generative art. | Editorial, Toy box | `npm i p5`. LGPL-2.1. |
| [Pretext](https://chenglou.me/pretext/) | Text layout without the DOM, so text can wrap around any shape and reflow live. | Editorial, Cinematic | `npm i @chenglou/pretext`. Read the demos before using it. |
| [Codrops](https://tympanus.net/codrops) | Tutorials and demos of web effects, with code. | All | Great for one-off ideas. Each demo has its own license. |

## Code, logs, grids and sound

| Source | Gives you | Families | Stack, install, notes |
| :- | :- | :- | :- |
| [Shiki](https://shiki.style) | Accurate code highlighting with real editor themes. | Quiet tool, Live ops | `npm i shiki`. MIT. Show real output, not a fake typing animation. |
| [Expressive Code](https://expressive-code.com) | Code blocks with frames, terminal windows, line marks and diffs. Built into Starlight. | Quiet tool | MIT. |
| [xterm.js](https://xtermjs.org) | A real terminal in the browser. | Live ops, Quiet tool | `npm i @xterm/xterm`. MIT. Heavy for a landing page; right for a live console. |
| [git-diff-view](https://mrwangjusttodo.github.io/git-diff-view/), [diff2html](https://diff2html.xyz) | GitHub-style code diffs, split or unified. | Live ops | `npm i @git-diff-view/react` or `npm i diff2html`. MIT. |
| [AG Grid Community](https://www.ag-grid.com) | An Excel-like grid: keyboard moves, sorting, filters, editing, thousands of rows. | Dense data, Live ops | `npm i ag-grid-community`. Free core is MIT; range selection, clipboard, grouping and Excel export are paid Enterprise features. |
| [TanStack Table](https://tanstack.com/table) | Headless table logic: you draw every cell, so the look is yours. | Dense data | `npm i @tanstack/react-table` (also Vue, Svelte, plain JS). MIT. |
| [TanStack Virtual](https://tanstack.com/virtual) | Smooth scrolling through thousands of rows or log lines. | Live ops, Dense data | `npm i @tanstack/react-virtual` (cores for Vue, Svelte, plain JS too). MIT. |
| [Tone.js](https://tonejs.github.io) | Make sounds and music in the browser: notes, synths, effects. | Toy box, Warm and cozy | `npm i tone`. MIT. Start muted; browsers need a tap before sound. |
| [Howler.js](https://howlerjs.com) | Play sound files simply, across browsers. | Toy box, Warm and cozy, Retro | `npm i howler`. MIT. Done and stable. |

## Shared data without logins

For a counter, a guestbook, votes: small data many people write to, with no accounts. Say in the note where the data lives and what stops spam.

| Source | Gives you | Notes |
| :- | :- | :- |
| [Supabase](https://supabase.com/docs) | A hosted Postgres with a JS client that works from a static page. | Agent docs. Free tier. Lock it down with row-level security before launch. |
| [Cloudflare D1](https://developers.cloudflare.com/d1/) + Workers | A small SQL database behind a tiny Worker endpoint. | Agent docs. Free tier. Good when the site is already on Cloudflare. |

## No library needed

The browser can do these on its own. Reach for them before adding a package.

- **Card flips and tilts:** CSS 3D transforms (`perspective`, `rotateY`, `backface-visibility`).
- **Page and state changes:** [View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API).
- **Respecting motion settings:** [`prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion).
- **Print:** an `@media print` stylesheet. Hide the chrome, set page breaks, use black text.

## Motion

| Source | Gives you | Families | Stack, install, notes |
| :- | :- | :- | :- |
| [Motion](https://motion.dev) | Springs, gestures, layout animation. The React default. | Most | Agent docs. `npm i motion`. MIT. |
| [GSAP](https://gsap.com) | Timelines, ScrollTrigger, SplitText. The scroll-scene default. | Cinematic, Editorial | Agent docs. `npm i gsap`. All plugins have been free since 2025. |
| [Lenis](https://lenis.dev) | Smooth scrolling that works with ScrollTrigger. | Cinematic, Editorial | Agent docs. `npm i lenis`. MIT. Turn it off for reduced motion. |
| [Auto Animate](https://auto-animate.formkit.com) | One line to animate lists as items come and go. | Warm and cozy, Quiet tool | `npm i @formkit/auto-animate`. MIT. |
| [Anime.js](https://animejs.com) | Small, framework-free timelines. | Toy box, Editorial | `npm i animejs`. MIT. |
| [Rive](https://rive.app) | Interactive vector animations with state machines: characters that react. | Warm and cozy, Toy box | Hosted editor; `npm i @rive-app/canvas`. Free exports play a Rive splash screen; removing it is paid. |
| [dotLottie](https://lottiefiles.com) | Play After Effects animations. | Warm and cozy | `npm i @lottiefiles/dotlottie-web`. MIT. |
| [transitions.dev](https://transitions.dev) | Ready-made transitions plus a motion-quality checker. | Most | From the team list. |

## Type, color and icons

| Source | Gives you | Notes |
| :- | :- | :- |
| [Fontshare](https://www.fontshare.com) | Free, quality display and text faces with real personality. | The fastest way out of the default-font look. |
| [Google Fonts](https://fonts.google.com) / [Fontsource](https://fontsource.org) | The big free library; Fontsource packs it for npm self-hosting. | `npm i @fontsource-variable/<font>`. |
| [Collletttivo](https://www.collletttivo.it), [Velvetyne](https://velvetyne.fr) | Free, odd, expressive type from small foundries. | Editorial and Toy box display faces. Check each font's license. |
| [Departure Mono](https://departuremono.com) | A pixel-flavoured monospace with character. | Retro, Quiet tool. MIT. |
| [Inter](https://rsms.me/inter) | The workhorse UI sans. | Fine for Dense data. Everywhere else it reads as the default, so pair it with something with character. |
| [Utopia](https://utopia.fyi) | Fluid type and spacing scales. | Paste the scale into CSS as variables. |
| [Radix Colors](https://www.radix-ui.com/colors) | Ready, accessible color scales with light and dark steps. | Good base for any family. |
| [oklch.com](https://oklch.com), [Realtime Colors](https://www.realtimecolors.com), [Leonardo](https://leonardocolor.io) | Pick colors in OKLCH, preview a palette on a page, and build contrast-safe palettes. | Write tokens in `oklch()`. |
| [Lucide](https://lucide.dev), [Phosphor](https://phosphoricons.com), [Tabler](https://tabler.io/icons), [Heroicons](https://heroicons.com) | Icon sets. Phosphor has 6 weights (good for Warm and Toy) and is finished and stable; Lucide is the shadcn default. | Use one set per project. |

## Type starting points

Several checked faces per family, so two projects don't land on the same pair. Pick on the brief; when two fit equally, see SKILL.md step 3 on toss-ups. G = Google Fonts, F = Fontshare (both free).

| Family | Display or headline | Text and UI | Mono or accent |
| :- | :- | :- | :- |
| Quiet tool | Geist (G), Switzer (F), Instrument Sans (G) | Geist, Inter (G), IBM Plex Sans (G) | Geist Mono, JetBrains Mono (G), Martian Mono (G) |
| Editorial | Fraunces (G), Instrument Serif (G), Boska (F), Zodiak (F) | Newsreader (G), Literata (G), Sentient (F) | DM Mono (G) |
| Archive and print | Young Serif (G), Gloock (G), Gambetta (F), Erode (F) | Libre Caslon Text (G), Literata (G) | Courier Prime (G), Special Elite (G), Kalam (G) for hand notes |
| Warm and cozy | Fredoka (G), Chillax (F), Cabinet Grotesk (F) | Nunito (G), General Sans (F), Atkinson Hyperlegible (G) | Pally (F) |
| Toy box | Clash Display (F), Bricolage Grotesque (G), Rubik Mono One (G) | Satoshi (F), Space Grotesk (G) | DM Mono (G) |
| Zine and collage | Big Shoulders Display (G), Tanker (F), Archivo Black (G) | Archivo (G), Supreme (F) | Special Elite (G), Courier Prime (G) |
| Cinematic | Panchang (F), Unbounded (G), Syne (G), Anybody (G) | Satoshi (F), Space Grotesk (G) | Geist Mono, Departure Mono |
| Retro | Silkscreen (G), VT323 (G), Geist Pixel | System UI fonts | Departure Mono |
| Live ops, Dense data | IBM Plex Sans Condensed (G), Khand (F) | IBM Plex Sans (G), Inter (G) | IBM Plex Mono (G), JetBrains Mono (G) |

Readability: Atkinson Hyperlegible and Lexend (G) are built for low-vision and dyslexic readers. Use one when the brief names that need.

## Look, don't install

Read these for the thinking behind a look; don't install them.

- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines): motion, depth and touch done carefully.
- [Material 3](https://m3.material.io): motion and color systems explained in depth.
- [Atlassian Design](https://atlassian.design): good writing and content rules.
- [Mobbin](https://mobbin.com), [Refero](https://refero.design), [Land-book](https://land-book.com), [Awwwards](https://www.awwwards.com), [Siteinspire](https://www.siteinspire.com): real screens and sites. Use them to turn "three sites I love" into specifics. The team list has more galleries.

## Generic-AI tells

Put the ones that fit in every build note's Avoid list.

- Purple-to-blue gradients, glowing blobs behind the hero, and sparkle emoji.
- Centered hero, one-line promise, two buttons, a gradient word. Then three equal feature cards with icons in rounded squares.
- Stock shadcn: zinc grays, 0.5rem radius on everything, Inter at one weight.
- Every block fading up as you scroll. Motion should mean something: show a change, give feedback, or lead the eye.
- Glass blur and soft shadows on every surface.
- Gray text on gray backgrounds that fails contrast.
- Fake logos, fake testimonials, fake numbers.
- Emoji used as icons.
- Dark mode as "black plus neon glow".
- Effects that hide content or block the first paint.
- Mixing three icon sets, or more than two fonts.
- A fake terminal that types itself out letter by letter.
- A whole famous site cloned (the Vercel or Linear look, top to bottom) instead of one or two traits borrowed.
- Chat bubbles for anything that isn't a chat.
- Dashboards made of big cards with one number each, and pie charts.

## Licenses to watch

- **GPL-3.0**: Pokemon Cards CSS. Copying it can pull your project under GPL.
- **MIT + Commons Clause**: React Bits, Canvas UI. Free to use, but you can't sell the components themselves.
- **Paid tiers**: Aceternity UI Pro, Unicorn Studio, Spline, Rive (free exports show a splash screen) and Mobbin have paid plans. Say so in the note if a pick needs one.
