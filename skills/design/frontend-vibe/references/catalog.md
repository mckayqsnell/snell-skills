# Catalog

Sources the frontend-vibe skill picks from. Each one was checked in November 2026: the link loads, the repo is active and not archived, and the npm name is real. Check again before you hand one off (SKILL.md step 3.5).

"Agent docs" means the source publishes Markdown made for agents: an `llms.txt`, or pages that work with `.md` added to the URL. Point the builder at those docs; they read better than scraped HTML.

## Route by vibe

Find the 1 or 2 families closest to the brief's dials. Then read their rows in the sections below. These are starting points, not recipes: borrowing one pick from a neighbouring family is how a page stops looking like a template.

| Family | Dials | Base | Alive thing candidates | Type direction |
| :- | :- | :- | :- | :- |
| **Quiet tool**: black and white, precise, fast | calm 1-2, playful 1-2 | Geist look on shadcn/ui, Kumo, Base UI, coss ui | Paper Shaders Dithering or Dot Grid, cobe globe, View Transitions, number tickers | Geist Sans + Geist Mono, or Inter |
| **Editorial**: led by type, reads like a magazine | calm 1-3, playful 1-3 | Plain CSS, or Base UI for the few controls | Pretext text wrapping around shapes, GSAP SplitText, Lenis scroll | A real serif (Fontshare, Collletttivo, Velvetyne) + a quiet sans |
| **Warm product**: friendly, soft, easy | calm 2-3, playful 3-4 | Radix Themes, HeroUI, Mantine | Auto Animate lists, Motion springs, a Rive character | A rounded or humanist sans (Fontshare), Phosphor icons |
| **Toy box**: tactile, bouncy, makes you poke it | calm 3-5, playful 4-5 | neobrutalism.dev, React Bits | Pokemon Cards CSS foil, Atropos tilt, Matter.js physics, Rough.js sketch lines | A chunky display face + mono |
| **Cinematic**: the page is the show | calm 4-5, any playful | Almost none: a few plain controls | ShaderGradient, Spark splats, Canvas UI, Paper Shaders, Unicorn Studio, GSAP ScrollTrigger + Lenis | One big display face, used huge |
| **Retro OS and games**: nostalgia, joke-friendly | playful 4-5 | 98.css, 7.css, XP.css, NES.css, 8bitcn | Sounds, pixel art, CRT or VHS effect (Canvas UI VHS) | Geist Pixel, system fonts |
| **AI app**: chat, agents, streaming | calm 2-3, playful 1-3 | AI Elements or assistant-ui on shadcn/ui, or Kumo | Streaming text, thinking states (Beautiful UI, prompt-kit) | Geist or Inter + a mono for tool output |
| **Dense data**: tables, dashboards, admin | calm 1-2, playful 1 | Carbon, Primer, Fluent 2, Mantine, Ant Design | Nothing big: speed and clarity are the feel. Maybe one live sparkline. | IBM Plex or the system's own |

## Bases: design systems and component libraries

| Source | Gives you | Families | Stack, install, notes |
| :- | :- | :- | :- |
| [Vercel Geist](https://vercel.com/geist) | The black-and-white Vercel look: colors, type, grid, materials. | Quiet tool, AI app | Agent docs (`.md` on any page). The React package isn't public, so take the tokens and font and build on shadcn/ui. Borrow the look, never the logo or brand. |
| [Geist font](https://vercel.com/font) | Geist Sans, Mono, Serif and Pixel. | Quiet tool, AI app, Retro | `npm i geist`, or Google Fonts. OFL. |
| [Cloudflare Kumo](https://kumo-ui.com) | Cloudflare's product UI: accessible React components on Base UI, blocks, light and dark tokens, streaming patterns. | Quiet tool, AI app, Dense data | Agent docs. `pnpm add @cloudflare/kumo @phosphor-icons/react`; `npx @cloudflare/kumo doc Button` prints docs. MIT. |
| [shadcn/ui](https://ui.shadcn.com) | Copy-in React components that you own. The base most libraries below build on. | Most | Agent docs. Restyle it: the stock zinc colors and radius are the biggest AI tell there is. MIT. |
| [Base UI](https://base-ui.com) | Unstyled, accessible React parts. Bring all of the look yourself. | Quiet tool, Editorial | Agent docs. `npm i @base-ui/react`. MIT. |
| [coss ui](https://coss.com/ui) | Cal.com's design system: crisp, neutral, shadcn-style. | Quiet tool | Agent docs. MIT. |
| [Radix Themes](https://www.radix-ui.com/themes) | Styled React components with real theme knobs (radius, scale, accent). | Warm product | `npm i @radix-ui/themes`. MIT. |
| [HeroUI](https://www.heroui.com) | Soft, rounded, friendly React components. | Warm product | Agent docs. `npm i @heroui/react`. Apache-2.0. |
| [Mantine](https://mantine.dev) | A huge React kit: forms, dates, charts, hooks. | Warm product, Dense data | Agent docs. `npm i @mantine/core`. MIT. |
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
| [Motion Primitives](https://motion-primitives.com) | Small, tasteful Motion parts. | Quiet tool, Warm product | shadcn registry. MIT. |
| [Animata](https://animata.design), [Cult UI](https://www.cult-ui.com) | Playful animated parts and odd widgets. | Toy box, Warm product | MIT. |
| [Rare UI](https://rareui.com), [beUI](https://beui.dev) | Unusual animated buttons, cards and text effects. | Toy box | shadcn and Tailwind. From the team list. |
| [Beautiful UI](https://beautifului.dev) | Streaming text, thinking states, approval cards, agent screens. | AI app | From the team list. |
| [AI Elements](https://elements.ai-sdk.dev) | Vercel's chat and agent parts for the AI SDK. | AI app | Agent docs. shadcn registry. Apache-2.0. |
| [assistant-ui](https://www.assistant-ui.com) | A full chat UI kit that works with any model backend. | AI app | `npm i @assistant-ui/react`. MIT. |
| [prompt-kit](https://prompt-kit.com) | Small AI parts: prompt box, message, reasoning, loader. | AI app | shadcn registry. MIT. |
| [threeui](https://threeui.com/browse), [GetLayers](https://www.getlayers.ai) | 3D page templates and scenes you copy as prompts. | Cinematic | From the team list. |

## Effects, shaders and 3D

| Source | Gives you | Families | Stack, install, notes |
| :- | :- | :- | :- |
| [Paper Shaders](https://shaders.paper.design) | Fast, light shader backgrounds: mesh gradient, grain, dithering, dot grid, liquid metal, halftone, water. | Quiet tool, Cinematic, Editorial | Agent docs. `npm i @paper-design/shaders-react`, or `@paper-design/shaders` with no framework. Apache-2.0. The best first pick for "make the background alive". |
| [ShaderGradient](https://www.shadergradient.co) | Grainy, slow, 3D moving gradients. | Cinematic, Warm product | `npm i @shadergradient/react`. Tune one at shadergradient.co/customize and paste the URL in. MIT. |
| [Canvas UI](https://canvasui.dev) | Shaders over live, clickable HTML: liquid, glass, frost, shatter, VHS, particle reveal. | Cinematic, Toy box | Agent docs. shadcn registry for React, Vue, Svelte, vanilla. Most effects need Chrome 157+; Firefox, Safari and Android get a plain fallback, so never hide content behind it. MIT + Commons Clause. |
| [Spark](https://sparkjs.dev) | Gaussian splats in three.js: real 3D scans you can dissolve and morph. | Cinematic | `npm i @sparkjsdev/spark three`. MIT. Heavy: one scene per page. |
| [three.js](https://threejs.org) | The 3D engine under most of this. | Cinematic | Agent docs. `npm i three`. MIT. |
| [React Three Fiber](https://r3f.docs.pmnd.rs) + [drei](https://drei.docs.pmnd.rs) | three.js as React parts, plus ready-made helpers. | Cinematic | `npm i @react-three/fiber @react-three/drei three`. MIT. |
| [Unicorn Studio](https://www.unicorn.studio) | Make WebGL scenes in a no-code editor, then embed them. | Cinematic | Hosted tool with a free tier. Good when the deadline is hours. |
| [Spline](https://spline.design) | Design 3D scenes in the browser, then embed them. | Cinematic, Warm product | Hosted tool. Embeds can be heavy on phones. |
| [Pokemon Cards CSS](https://poke-holo.simey.me) | Holographic foil cards that tilt and shine. | Toy box | Copy the CSS from [the repo](https://github.com/simeydotme/pokemon-cards-css); a little JS tracks the pointer. GPL-3.0: check that this fits the project. |
| [Atropos](https://atroposjs.com) | 3D parallax tilt on hover or touch. | Toy box, Warm product | `npm i atropos`. MIT. Done and stable, last release 2023. |
| [Matter.js](https://brm.io/matter-js) | 2D physics: things you can throw, stack and knock over. | Toy box | `npm i matter-js`. MIT. |
| [cobe](https://cobe.vercel.app) | A tiny WebGL dotted globe. | Quiet tool | `npm i cobe`. MIT. 5 kB. |
| [Rough.js](https://roughjs.com) | Hand-drawn, sketchy lines and shapes. | Toy box, Editorial | `npm i roughjs`. MIT. Done and stable. |
| [tsParticles](https://particles.js.org) | Particles, confetti, fireworks. | Toy box | `npm i @tsparticles/slim`. MIT. Use for one moment (a win), not a background. |
| [p5.js](https://p5js.org) | Creative coding for generative art. | Editorial, Toy box | `npm i p5`. LGPL-2.1. |
| [Pretext](https://chenglou.me/pretext/) | Text layout without the DOM, so text can wrap around any shape and reflow live. | Editorial, Cinematic | `npm i @chenglou/pretext`. Read the demos before using it. |
| [Codrops](https://tympanus.net/codrops) | Tutorials and demos of web effects, with code. | All | Great for one-off ideas. Each demo has its own license. |

## Motion

| Source | Gives you | Families | Stack, install, notes |
| :- | :- | :- | :- |
| [Motion](https://motion.dev) | Springs, gestures, layout animation. The React default. | Most | Agent docs. `npm i motion`. MIT. |
| [GSAP](https://gsap.com) | Timelines, ScrollTrigger, SplitText. The scroll-scene default. | Cinematic, Editorial | Agent docs. `npm i gsap`. All plugins have been free since 2025. |
| [Lenis](https://lenis.dev) | Smooth scrolling that works with ScrollTrigger. | Cinematic, Editorial | Agent docs. `npm i lenis`. MIT. Turn it off for reduced motion. |
| [Auto Animate](https://auto-animate.formkit.com) | One line to animate lists as items come and go. | Warm product, Quiet tool | `npm i @formkit/auto-animate`. MIT. |
| [Anime.js](https://animejs.com) | Small, framework-free timelines. | Toy box, Editorial | `npm i animejs`. MIT. |
| [Rive](https://rive.app) | Interactive vector animations with state machines: characters that react. | Warm product, Toy box | Hosted editor; `npm i @rive-app/canvas`. |
| [dotLottie](https://lottiefiles.com) | Play After Effects animations. | Warm product | `npm i @lottiefiles/dotlottie-web`. MIT. |
| [transitions.dev](https://transitions.dev) | Ready-made transitions plus a motion-quality checker. | Most | From the team list. |
| [View Transitions](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | Built-in browser page and state transitions. No library. | Quiet tool, Editorial | Works in all current major browsers. |

## Type, color and icons

| Source | Gives you | Notes |
| :- | :- | :- |
| [Fontshare](https://www.fontshare.com) | Free, quality display and text faces with real personality. | The fastest way out of the default-font look. |
| [Google Fonts](https://fonts.google.com) / [Fontsource](https://fontsource.org) | The big free library; Fontsource packs it for npm self-hosting. | `npm i @fontsource-variable/<font>`. |
| [Collletttivo](https://www.collletttivo.it), [Velvetyne](https://velvetyne.fr) | Free, odd, expressive type from small foundries. | Editorial and Toy box display faces. Check each font's license. |
| [Inter](https://rsms.me/inter) | The workhorse UI sans. | Fine for Dense data. Everywhere else it reads as the default, so pair it with something with character. |
| [Utopia](https://utopia.fyi) | Fluid type and spacing scales. | Paste the scale into CSS as variables. |
| [Radix Colors](https://www.radix-ui.com/colors) | Ready, accessible color scales with light and dark steps. | Good base for any family. |
| [oklch.com](https://oklch.com), [Realtime Colors](https://www.realtimecolors.com), [Leonardo](https://leonardocolor.io) | Pick colors in OKLCH, preview a palette on a page, and build contrast-safe palettes. | Write tokens in `oklch()`. |
| [Lucide](https://lucide.dev), [Phosphor](https://phosphoricons.com), [Tabler](https://tabler.io/icons), [Heroicons](https://heroicons.com) | Icon sets. Phosphor has 6 weights (good for Warm and Toy); Lucide is the shadcn default. | Use one set per project. |

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

## Licenses to watch

- **GPL-3.0**: Pokemon Cards CSS. Copying it can pull your project under GPL.
- **MIT + Commons Clause**: React Bits, Canvas UI. Free to use, but you can't sell the components themselves.
- **Paid tiers**: Aceternity UI Pro, Unicorn Studio, Spline, Rive and Mobbin have paid plans. Say so in the note if a pick needs one.
