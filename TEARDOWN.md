# madebykota.com: Teardown and TypeScript Rebuild

**Subject:** <https://madebykota.com/> (Framer build `b4b3e20`, published 25 Sep 2026)
**Deliverable:** a reverse-engineered effects catalogue, the original stack, and a production TypeScript rebuild (Next.js 15.5, React 19.2, Motion 12, Lenis 1.3)
**Scope note:** this covers the website teardown and rebuild only. The SaaS-onboarding brief in the prompt was left out by choice. The site uses no WebGL, so the geometry/texture disposal requirement is applied to the resources the site does hold: video decoders, the Lenis loop, rAF handles, observers, listeners and timers. See section 7.

Every claim below carries a confidence tag:

| Tag | Meaning |
| --- | --- |
| **[V] Verified** | Read directly from the live site's HTML, the `__framer__appearAnimationsContent` JSON, or its JS chunks |
| **[O] Observed** | Seen in Playwright screenshots of the live site at 1440x900 and 390x844 |
| **[I] Inferred** | The most plausible mechanism, consistent with [V] and [O] but not read from code |

---

## 1. Summary

The site is a Framer build that feels expensive because of seven decisions:

1. **A 3.25 s staged intro.** Eight project shots spring up into a stack, then a hard-edged wipe reveals the hero. [V]
2. **Heavy, slow smooth scroll.** Lenis runs with a 2.0 s duration, so every scroll-linked effect glides. [V]
3. **One signature move.** A 142 px clip inside the headline detaches and grows with the scroll until it *becomes* the full-screen showreel backdrop. [V]
4. **Sticky "chapters".** The services, testimonials and work sections each pin a stage and swap content as invisible triggers pass the viewport center. [V]
5. **Word-by-word testimonial reveal.** Unread words sit at 20% opacity. [V]
6. **A clip-path "lens" portfolio.** A pinned circular window wipes from one project to the next. [O] + [I]
7. **"Liquid glass" UI chrome.** Backdrop blur plus six stacked inset shadows, with a nav that flips dark/light by section. [V]

Nothing uses WebGL or canvas. The rest is transforms, opacity, sticky positioning, masks and muted MP4s from Mux.

---

## 2. Tech stack and how to recreate it

### 2.1 Original stack [V]

| Layer | What the live site uses | Evidence |
| --- | --- | --- |
| Builder / runtime | Framer (React under the hood), SSR + hydration, 3 breakpoints | `<meta name="generator" content="Framer b4b3e20">`, `data-framer-hydrate-v2` |
| Animation | Framer Motion (`motion.mjs` chunk): appear animations, scroll transforms, variant triggers | `__framer__appearAnimationsContent`, `__framer__transformTargets`, `__framer__variantAppearEffectEnabled` |
| Smooth scroll | Lenis inside Framer's "Smooth Scroll" component, `intensity: 20` -> `duration: 2.0` | `new Lenis({smoothWheel, duration: o/10, autoRaf, anchors, allowNestedScroll, stopInertiaOnNavigate ...})` |
| Video | Mux MP4 renditions picked per breakpoint (270p phone / 480p tablet / 1080p desktop), `preload="none"`, muted, loop | `stream.mux.com/.../1080p.mp4` |
| Custom code components | Video morph (`#hero-video` -> `#playreel-video`), scroll reveal text, text shimmer, date/time | Inline in page chunk `Et081ix...mjs`, `lbfin7_28...mjs`, `KwD1G_z7i...mjs` |
| Fonts | TWK Lausanne 300/400/500 (commercial, Weltkern) + Inter; 3 woff2 preloaded | `<link rel="preload" as="font">` |
| CMS | Framer CMS for the 5 featured templates | `query:` + `.map(...)` in the page chunk |
| Analytics | Framer events script | `events.framer.com/script?v=2` |

Breakpoints [V]: desktop `>= 1200px`, tablet `810-1199.98px`, phone `<= 809.98px`. Framer renders each breakpoint's tree on the server and hides the others with `hidden-<hash>` classes.

### 2.2 Rebuild stack (this repo)

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js 15.5 App Router**, React 19.2, TypeScript strict (`noUncheckedIndexedAccess`) | You already ship on Next 15. Static prerender with a 177 kB first load |
| Animation | **motion 12.43** (`motion/react`) | The same engine Framer uses, so the springs and eases port 1:1 |
| Smooth scroll | **lenis 1.3.26** with the original's options | Lenis drives the real window scroll, so `sticky`, IO and `useScroll` keep working |
| Styling | CSS Modules + one `tokens.css` | Centralized brand tokens and zero runtime CSS-in-JS |
| Fonts | `@fontsource-variable/inter-tight` (self-hosted, **no `next/font`**) | Free stand-in for Lausanne. Swap `--font-sans` |
| Images | `next/image` (AVIF/WebP, responsive `sizes`) | Equivalent to Framer's `scale-down-to` srcsets |
| Video | Native `<video>` with WebM VP9 first and MP4 H.264 fallback | Mux is optional: drop Mux URLs into `site.ts` |

### 2.3 Recreate it in this order (each step builds on the last)

1. **Tokens first** (`tokens.css`, `motion.ts`). Every later component reads from them, so nothing is retuned twice.
2. **Lenis provider.** With scroll feel settled, every scroll-linked effect can be tuned against the final feel.
3. **Primitives:** `GlassButton`, `LazyVideo`, `TextShimmer`, `LiveClock`, `CountUp`, `ScrollRevealText`.
4. **Static sections** (About, FAQ, CTA/Footer). Their layout is easy to verify.
5. **Sticky chapters** (Services, Testimonials, Templates). These are IntersectionObserver-driven.
6. **Hero + Playreel + VideoMorph** last. The morph depends on the final layout of both sections.
7. **Loader** at the very end. It only coordinates timing, through `IntroProvider`.

---

## 3. Design tokens [V]

### 3.1 Color

| Token | Value | Use |
| --- | --- | --- |
| canvas | `#efefef` | light sections |
| ink | `rgba(0,0,0,.96)` | text on light |
| ink-muted | `#656565` | labels |
| night | `#000` | hero, reel, work, footer |
| paper | `rgba(255,255,255,.96)` / `.6` / `.15` | text on dark, muted, hairlines |
| accent | `#042db4` | deep blue (focus ring in rebuild) |

### 3.2 Type scale

TWK Lausanne. Tracking is about -3% at display sizes and tapers to -0.5% for small text.

| Preset | Size / line-height | Tracking | Weight | Used for |
| --- | --- | --- | --- | --- |
| display | 88 / 96 | -2.64px | 400 | hero rows, PLAY/REEL |
| h1 | 72 / 80 | -2.16px | 400 | template names |
| h2 | 56 / 64 | -1.68px | 400 | service names |
| h3 | 44 / 52 | -0.88px | 300 | FAQ title |
| h4 | 36 / 44 | -0.72px | 300 | about statement, testimonials |
| h5 | 28 / 36 | -0.28px | 500 | menu links |
| body / small / micro | 16/24, 14/20, 12/16 | about -0.5% | 300-400 | UI |

### 3.3 Glass recipe

These are the box-shadow stacks exactly as they appear on the site:

- light rim: `inset 0 +/-4px 1px -4px #fff`, `inset 0 +/-1px 0 rgba(255,255,255,.88)`, `inset 0 +/-40px 10px -40px rgba(255,255,255,.96)`
- side vignette (dark): `inset +/-20px 0 20px -30px rgba(0,0,0,.3)`
- body: `backdrop-filter: blur(10px)`

---

## 4. Effects catalogue: every animation, interaction and hover

Each entry gives what you see, how the original does it, the exact values, and how the rebuild does it.

### 4.1 Intro loader (0-4.5 s) [V]

- **What you see:** black screen with `0%` on the left, the studio name in the center and a counter on the right. Eight website screenshots fly up from below, alternating right and left, and stack in the center. Then the black layer is wiped away from the bottom up, revealing the hero.
- **Original values:**
  - Cards start at `y: 1000` with x offsets `[600, -550, 500, -450, 400, -350, 300, -250]`. Offsets alternate sides and shrink, so later cards land more centrally.
  - Spring `{stiffness: 400, damping: 100, mass: 1}` with delays `0.5, 0.65, ... 1.4, 1.5`.
  - `transformTemplate: "translate(-50%, -50%) <animated transform>"` keeps the centering in the same transform.
  - At **3.25 s** the component's auto-advance (`delay(() => setVariant(...), 3250)`) switches to the exit variant. That animates a hard-edged `mask: linear-gradient(0deg, transparent -1%, black 0%)` to `transparent 100%, black 101%`, a bottom-up wipe.
  - The hero layer rises at 3.25 s (`y: 100 -> 0`). On phones, the headline and scroll cue follow at 3.5 s (`y: 24 -> 0`).
- **Why the spring reads as "expensive":** the damping ratio is `100 / (2*sqrt(400))` = **2.5**, heavily over-damped. Cards decelerate hard with zero overshoot, like a camera move rather than a bounce.
- **Rebuild:** `Loader.tsx` plus `IntroProvider.tsx`.
  - The counter is a `MotionValue` rendered as a motion child: about 200 text updates and 0 React renders.
  - The wipe is `clip-path: inset(0 0 0 0) -> inset(0 0 100% 0)` with `EASE_FILM [.3,0,.2,1.01]` over 1.25 s. The edge is just as hard, but clip-path is on Motion's hardware-accelerated (WAAPI) list and needs no mask texture.
  - Scroll is locked (`lenis.stop()`, `overflow:hidden`, `scrollRestoration='manual'`) and restored in cleanup.
  - The loader **unmounts** when done, releasing 8 images and their nodes.
  - Under `prefers-reduced-motion` the whole intro compresses to under 1 s.
- **[O] note:** the live right-hand label already read 99% at 1.2 s, so it is either very fast or static. The rebuild animates 0 to 100 across the intro instead.

### 4.2 Smooth scroll [V]

- Lenis runs with `duration: 2.0` (Framer `intensity 20 / 10`), `smoothWheel`, `autoRaf`, `anchors` (smooth in-page links), `allowNestedScroll` (menus keep native scroll) and `stopInertiaOnNavigate`. `syncTouch` is off, so touch devices keep native momentum.
- **Rebuild:** `SmoothScrollProvider.tsx` uses the same options and exposes the instance through `useLenis()`. It is disabled entirely under reduced motion, and `destroy()` runs on unmount.
- **Found in testing:** after a soft navigation that lands mid-scroll, Lenis 1.3.26's 400 ms velocity-reset timer re-adds `lenis` to `<html>` after `destroy()`. The provider strips leftover classes once when no instance is alive. This was verified in Playwright.

### 4.3 Glass chrome, adaptive nav and menu [V]

- **Glass buttons:** the four Framer layers are named `fill + shadow`, `fog`, `inner shadow` and `highlights`. The rebuild uses four absolutely-positioned spans in `GlassButton`.
- **Hover:** fog fades in and the highlights brighten. Only `opacity` animates, never the blur, so the backdrop isn't recomputed per frame. **Press:** `scale(.97)`.
- **Tone switch [O]:** the nav pills are dark glass over dark sections and light glass over light ones.
  - Rebuild: each top-level section declares `data-nav-tone`.
  - One IntersectionObserver with `rootMargin: '0px 0px -95% 0px'` watches a 5%-tall band under the header. No scroll listener exists.
- **Menu [V]:** a glass dropdown opens from the center button. Links enter with `y: 12 -> 0`, 0.18 s, ease `[.12,.23,.5,1]`, **stagger 0.05 s**.
  - Rebuild adds a11y: `aria-expanded`/`aria-controls`, and focus moves to the first link.
  - Escape and outside clicks close it, and focus returns to the trigger. This was verified.

### 4.4 Hero [V]

| Element | Behaviour | Values |
| --- | --- | --- |
| Headline | Three right-aligned rows of separate text nodes; the real `<h1>` holds the full sentence for SEO (the rebuild uses an sr-only `h1` + `aria-hidden` rows) | 88/96, gaps 56 px and 16 px |
| Inline media | Row 2 starts with a **142 px, 1.77:1 muted clip**; row 3 has an inline glyph | `#hero-video` |
| "Available for new projects" | **Text shimmer**: a diagonal light band sweeps through clipped text | speed 8 (cycle `11 - 8 = 3 s`), size 65, rotation 120deg, base `rgb(109,109,109)`, shine `#fff` |
| Clock | Studio-local time `5:51 AM (GMT +7)` | `Intl.DateTimeFormat`, 12h |
| Scroll cue | Vertical "Scroll for more" + animated line pair | Loop |
| Background | Blurred wall of project screenshots with **parallax** (`speed: 110`) and a fade to 0 | `__framer__parallaxTransformEnabled` |
| Scroll-out | Badge, clock, cue and tagline fade 1 -> 0 as a white "Text Fade out trigger" (top 50vh of the reel) arrives | `transformTrigger: onScrollTarget` |

**Rebuild details:**

- `useScroll({target: hero, offset: ['start start','end start']})` maps to `fade [0, .45] -> [1, 0]`, `bgY 0 -> 25%` and `bgOpacity`. Motion hands these to a native ScrollTimeline where supported, off the main thread.
- **Critical gotcha:** the fade is applied to *each text segment*, never to a wrapper around the clip.
  - An ancestor with `opacity < 1` would fade the fixed-position clip too, because fixed elements still paint inside ancestor stacking contexts.
  - An ancestor `transform` would re-anchor `position: fixed`.
  - `.content` also has no `z-index`, so it never traps the clip below the reel.
  - Verified: computed `transform: none` after the entrance.
- **Shimmer optimization:** Framer's component injects a new `<style>` with its own `@keyframes` *per instance*. The rebuild shares one keyframe parameterized by CSS custom properties.
- **Clock optimization:** it sleeps until the next minute boundary, then ticks every 60 s instead of every second. It renders a placeholder on the server to avoid a hydration mismatch.
- **Scroll cue:** a `scaleY` keyframe that swaps `transform-origin` mid-cycle, so the line fills downward and drains downward. It is compositor-only.

### 4.5 Signature effect: hero clip -> full-screen reel (video morph) [V]

This is a custom code component on the live site. It finds `#hero-video`, `#playreel-video` and `#hero-video-overlay` by id. The algorithm, as read from the source:

```text
p    = clamp((innerHeight - playreel.top) / innerHeight, 0, 1)   // 0 when reel is below the fold, 1 when it reaches the top
rest = clip's rect at p = 0 (cached, re-measured on resize)
rect = lerp(rest, playreel.getBoundingClientRect(), p)
clip    -> position: fixed; left/top/width/height = rect; object-fit: cover; z 7
overlay -> same rect; opacity = p; z 8 (dark gradient grows as the clip becomes a backdrop)
placeholder div (same size, visibility hidden) inserted after the clip so the headline never reflows
p <= 0  -> restore original inline style, remove placeholder
```

- With a 100vh hero directly above the reel, `p = scrollY / innerHeight`. The clip starts flying the moment you scroll, and it lands exactly as the reel section reaches the top. After that it stays glued to the reel rect, because `p` is clamped at 1 while the target keeps moving up.
- It is skipped under `prefers-reduced-motion` and on phones, where the live site uses a separate `onMobile` clip.

**Rebuild:** `VideoMorph.tsx` provides `useVideoMorph` plus a provider that hands typed refs to Hero (source) and Playreel (target) instead of global ids. Optimizations, all commented in code:

1. rAF-coalesced: any number of scroll events produce one update per frame.
2. Strict read-then-write: one `getBoundingClientRect()` per frame, then writes. No layout thrash.
3. Static styles are written once on activation. Per frame only `left/top/width/height/opacity` change.
4. Writes are skipped when the box moved by less than half a pixel. Lenis' long tail produces many sub-pixel frames.
5. **Parked mode:** once the reel is fully above the viewport, the clip is written once more, then all work stops until it returns.
6. `contain: layout paint` on the fixed clip keeps its relayout local.

*Trade-off considered:* animating `transform: scale()` instead of width/height would be compositor-only. But the start (1.77:1) and end (viewport) aspect ratios differ, so a non-uniform scale would visibly squash the video. Geometry writes with `object-fit: cover` stay undistorted, so the rebuild keeps the original approach and hardens it.

### 4.6 Play reel [V]

- As the section travels from the bottom of the viewport to the top, **PLAY slides in from x -300**, **REEL from x +300**, and the **play pill scales 0.5 -> 1**. These are three `onScrollTarget` transforms.
- Backdrop: black plus the "Faded Overlay" gradient `rgba(0,0,0,.6) -> .45 -> .08`. Meta labels: `[ 00:44 ]` and `(c)2026`.
- **Rebuild:** `useScroll({offset: ['start end','start start']})` drives three `useTransform`s. The play button opens `ReelModal`:
  - It uses the native `<dialog>` + `showModal()`, which gives a focus trap, Escape handling and an inert background for free.
  - Lenis is stopped while it is open.
  - The `<video>` exists only while open and is disposed on close. Verified: `lenis-stopped` while open, video removed after Escape.

### 4.7 About + facts slider [V/O]

- The statement (36/44, weight 300) fades up once in view. The facts block shows "Project completed 15+", prev/next glass arrows and a counter that counts up.
- **Rebuild:**
  - `whileInView` with `viewport={{once: true, amount: .4}}`.
  - `AnimatePresence mode="wait"` swaps facts with a 12 px slide and fade.
  - `CountUp` runs `animate(0, value)` and writes `textContent` directly (0 re-renders), then `controls.stop()` on unmount or change.
  - The server HTML carries the real number for SEO and no-JS visitors. It rewinds to 0 after hydration.

### 4.8 Services: sticky scroll-switched chapters [V]

- **Structure on the live site:**
  - The left column holds a `Service` component with variants (Landing page / MKT Website / Motion Design, plus tablet and phone versions).
  - The right column holds a **Sticky Video** (100vh, 8 px inset, rounded) and three invisible trigger blocks (`Landing Page Trigger`, `MKT Site Trigger`, `Motion Design Trigger`).
  - A Framer "variant appear" with `targets: [{ref, target: variant}]` and `threshold: .5` swaps the sticky video's variant as each trigger becomes half-visible.
  - An index at bottom right ("Landing Page -- / Marketing Site / Motion Design") marks the active service.
- **Rebuild:** `Services.tsx`.
  - The track is `N x 100vh` with a sticky 100vh stage. N absolutely-stacked 100vh triggers sit behind it.
  - One IntersectionObserver with `rootMargin: '-50% 0px -50% 0px'` turns the viewport into a zero-height center line, so exactly one trigger intersects at a time. This is deterministic, unlike threshold races.
  - Details crossfade (`y 16`, 0.3 s). Clips crossfade on `opacity` only.
  - **Only the active clip decodes:** `LazyVideo active={i === active}` pauses the hidden ones.
  - Phones get a plain stacked list. Both trees are server-rendered and hidden by CSS, the way Framer does it. Hidden videos never intersect, so they never download.

### 4.9 Testimonials: word-by-word scroll reveal [V]

- **Original component:**
  - It splits on spaces into inline-block spans.
  - Per word: `local = clamp(progress * n - i, 0, 1)`, `opacity = o0 + (1 - o0) * local`, `blur = b0 * (1 - local)`.
  - Each word has a `0.2s ease-out` transition.
  - Testimonial settings: **initialOpacity .2, initialBlur 0, fullRevealDistance 800**, 36/44 Lausanne 300.
  - It calls `setState` on every scroll event and re-renders every word.
- **Rebuild (`ScrollRevealText`):** the same math moved into CSS.
  - One custom property `--p` (0..1) is written on the wrapper per frame.
  - Each word computes its own opacity from `--p`, `--n` and `--i` with CSS `clamp()`.
  - Result: **zero React renders while scrolling**, one style write per frame, and the listener exists only while on screen.
  - Blur is opt-in, because a filter per word is a paint per word.
- Each row is 150vh. Label, quote and author share **one** sticky container so they pin and release together. Because a stuck element's rect stops moving, the reveal is driven by the row (`trackRef`) instead.

### 4.10 Portfolio showcase: the clip-path lens [V + O + I]

- **[V]**
  - Five CMS items, each a 100vh block with a full-bleed scene ("Image 1") and a centered lens image ("Image 2 / Centered Image").
  - A sticky container holds **Center Pagination**: five variants switched by targets at `threshold .5`.
  - Hover on the image: **scale 1.05, 0.15 s, ease `[.12,.23,.5,1]`**.
  - The name sits in a "Name Mask".
- **[O]** At the boundary between two items, the circular lens shows the top half of one project and the bottom half of the next. The big name on the right splits the same way.
- **[I] Mechanism, as implemented in the rebuild:**
  - Each slide has `clip-path: inset(0)` and contains a `position: fixed` layer (lens + name).
  - `clip-path` clips *all* descendants to the slide's box, fixed ones included, and it **also clips hit-testing**.
  - So every slide's fixed layer is visible and clickable only where that slide is. The slide boundary becomes a moving wipe through the lens, with zero JS per frame.
  - Verified: at a boundary, `elementFromPoint` returns slide 0 in the top half and slide 1 in the bottom half, and hover scales only the visible lens.
- **Paint culling (rebuild addition):** a fixed layer counts as on screen even when fully clipped, so a second observer sets `visibility:hidden` on layers of non-intersecting slides. Only 1-2 layers are ever rasterized.
- **Pagination ring:** a thin full circle plus one bright 56deg arc whose group rotates (spring) to `-60deg + i * 72deg`. Numbers sit outside the ring at 35% or 100% opacity. It is one SVG with one composited rotate per change.
- **Overlay containment bug fixed during testing:** a sticky overlay with `margin-bottom: -100vh` overhangs the next section by 100vh. The rebuild puts the sticky overlay inside an `absolute; inset: 0` track so it can never leave the section.

### 4.11 FAQ [V/O]

- Two columns of white cards (radius 12). The "+" rotates 45deg into an "x". Framer variants: `Large - Expand`, `Large - Closing`.
- **Rebuild:** a real `<button aria-expanded aria-controls>` with a `role="region"` panel. Motion animates `height: 0 <-> 'auto'` (measured once, tweened in px) with `EASE_FILM`, 0.4 s. Closed panels unmount, so no hidden text remains in the tab order.

### 4.12 CTA + footer curtain [O + I]

- **[O]** "Let's get started!" stays put while the black footer slides over it. The footer's top edge blurs the CTA progressively and fades to black. Below are the credits, Index and Socials columns, a full-width wordmark, the clock and a back-to-top button.
- **[V]** The layers are named `Footer Blur`, `BG Wrap`, `Blur` and `Solid`. The site uses backdrop blurs of 4 px and 10 px.
- **Rebuild (pure CSS, server component):**
  - The CTA is `position: sticky`.
  - The footer's 45vh top band stacks `blur(4px)` masked to the upper band, `blur(10px)` masked to the lower band, and a solid gradient to black. That gives a progressive blur with no JS.
  - The wordmark is an SVG `<text textLength="1200" lengthAdjust="spacing">`, so it spans the full width with any font.
  - Back-to-top uses `lenis.scrollTo(0, {duration: 2})`, falling back to native smooth scroll.

### 4.13 Hover and interaction summary

| Element | Hover / press | Timing |
| --- | --- | --- |
| Glass pills | fog 0 -> 1, highlights brighten; press scale .97 | 250 ms, `[.12,.23,.5,1]` |
| Menu links | opacity -> .6 | 150 ms |
| Template lens | image scale 1.05 | 150 ms, `[.12,.23,.5,1]` |
| Play pill | fill brightens | 250 ms |
| Footer links | opacity -> .6 | 150 ms |
| FAQ row | icon rotates 45deg, panel height auto | 400 ms, `[.3,0,.2,1.01]` |

All hover rules sit inside `@media (hover: hover)`, so touch devices never get sticky hover states.

---

## 5. Effects comparison table

| # | Effect | Trigger | Technique (rebuild) | Per-frame cost | Confidence |
| --- | --- | --- | --- | --- | --- |
| 1 | Intro card stack + wipe | Time (0.5-4.5 s) | Motion springs + WAAPI clip-path | Compositor | V |
| 2 | Smooth scroll | Wheel | Lenis, 2.0 s | 1 rAF loop | V |
| 3 | Adaptive glass nav | Section under header | 1 IntersectionObserver | None | V/O |
| 4 | Menu stagger | Click | Motion variants | Compositor | V |
| 5 | Hero entrance | Intro clock | Spring `y:100->0` | Compositor | V |
| 6 | Hero parallax + fade | Scroll | `useScroll` -> ScrollTimeline | Compositor where supported | V |
| 7 | Text shimmer | Loop | Shared CSS keyframe | Paint of 1 line | V |
| 8 | **Clip -> reel morph** | Scroll | rAF read->write, fixed geometry | 1 read + 5 writes, local layout | **V** |
| 9 | PLAY/REEL converge | Scroll | `useScroll` + 3 transforms | Compositor | V |
| 10 | Count-up | In view | `animate()` -> textContent | Text paint | O |
| 11 | Services chapters | Center line | IO + crossfade, active-only decode | None between switches | V |
| 12 | Word reveal | Scroll | 1 CSS var, CSS clamp math | 1 style write | V |
| 13 | Lens wipe gallery | Scroll | clip-path + fixed layers | **0 JS** | O/I |
| 14 | Pagination ring | Center line | Spring rotate on 1 SVG group | Compositor | V |
| 15 | FAQ accordion | Click | Motion height auto | Layout during 0.4 s | V/O |
| 16 | Footer curtain + progressive blur | Scroll | sticky + 2 masked backdrop-filters | GPU blur | O/I |

---

## 6. Architecture overview

```text
app/layout.tsx            (server)  html/body, Fontsource import, globals.css -> tokens.css
app/page.tsx              (server)  composition only, passes typed content from content/site.ts
  SmoothScrollProvider    (client)  owns the Lenis instance; useLenis()
    IntroProvider         (client)  shared intro clock: exitAt / heroDelay / chromeDelay / done
      VideoMorphProvider  (client)  source/target refs + useVideoMorph + the fixed overlay
        Loader            (client)  card stack, counter, wipe, scroll lock; unmounts when done
        Nav               (client)  GlassButton x3, tone observer, menu (a11y)
        main
          Hero            (client)  LazyVideo[morph source], TextShimmer, LiveClock, parallax/fade
          Playreel        (client)  morph target, converge transforms, ReelModal(<dialog>)
          About           (client)  statement reveal, facts slider, CountUp
          Services        (client)  sticky stage, center-line triggers, LazyVideo x N (active-gated)
          Testimonials    (client)  TestimonialRow x N -> ScrollRevealText(trackRef)
          TemplatesGallery(client)  sticky overlay + PaginationRing, clip-path slides, culling
          Faq             (client)  AccordionItem x N
        CtaFooter         (server)  sticky CTA, progressive blur, wordmark; islands: LiveClock, BackToTop
```

### Component reference

| Component | Kind | Props (typed) | Responsibility | Resources it owns (and disposes) |
| --- | --- | --- | --- | --- |
| `SmoothScrollProvider` | client | `children, intensity?` | Lenis lifecycle, context | Lenis rAF loop, wheel/touch/resize listeners, ResizeObservers, `<html>` classes |
| `IntroProvider` | client | `children, enabled?` | One timeline for loader -> hero -> chrome | none |
| `VideoMorphProvider` / `useVideoMorph` | client | `sourceRef, targetRef, overlayRef, enabled` | Signature morph | scroll/resize/orientation listeners, rAF, settle timer, placeholder node, inline styles |
| `Loader` | client | `images, brand` | Intro | count tween, scroll lock, 8 images (unmount) |
| `Nav` | client | `brand, links, socials, cta` | Header, tone, menu | IO, keydown + pointerdown listeners (open only) |
| `GlassButton` | server-safe | `tone, size, href? , ...native` (discriminated union a/button) | Glass pill | none |
| `LazyVideo` | client | `video, active?, preloadMargin?, ref?` | Lazy, visibility-gated muted video | 2 IOs; **decoder via `disposeVideo()`** |
| `TextShimmer` | server-safe | `text, speed, size, rotation, direction, colors, as` | Shimmer | none (CSS) |
| `LiveClock` | client | `timeZone, hour12?` | Studio clock | timeout + interval |
| `CountUp` | client | `value, suffix?, duration?` | Count-up | Motion animation (`stop()`) |
| `ScrollRevealText` | client | `text, revealDistance, initialOpacity, initialBlur, start, sticky, trackRef?` | Word reveal | IO, scroll/resize listeners (on-screen only), rAF |
| `Hero` | client | `content, timeZone` | Hero | (children) |
| `Playreel` / `ReelModal` | client | `content` / `open, onClose, video, title` | Reel + player | dialog close listener, Lenis stop/start, decoder |
| `About` | client | `content` | Statement + facts | (children) |
| `Services` | client | `content, contactHref` | Sticky chapters | IO |
| `Testimonials` | client | `items` | Rows | (children) |
| `TemplatesGallery` / `PaginationRing` | client | `content` / `count, active, arc?` | Lens gallery | 2 IOs (center line + culling) |
| `Faq` | client | `content, email` | Accordion | none |
| `CtaFooter` | server | `cta, footer, nav, brand` | Curtain footer | none (islands own theirs) |

---

## 7. Resource lifecycle and disposal

The brief asked for geometry and texture disposal. The live site has **no WebGL**: no geometries, textures, materials or render targets. The same discipline therefore applies to what *does* hold GPU, decoder or CPU resources:

| WebGL concept | Equivalent here | Disposal in the rebuild |
| --- | --- | --- |
| `texture.dispose()` | Decoded video frames + network buffer | `disposeVideo()`: `pause()`, `removeAttribute('src')` and `load()` reset the media pipeline immediately instead of at GC (`LazyVideo`, `ReelModal`) |
| `renderer.setAnimationLoop(null)` | Lenis rAF loop, morph rAF, reveal rAF | `lenis.destroy()`, `cancelAnimationFrame` in every hook cleanup (`useRafCallback`) |
| Scene graph refs | Injected placeholder node, inline styles on the clip | `deactivate()` restores the original `style` attribute and removes the placeholder |
| Event subscriptions | scroll / resize / orientation / keydown / pointerdown / dialog close | Removed in cleanup; the reveal's scroll listener only exists while on screen |
| Observers | 10+ IntersectionObservers | `disconnect()` in cleanup; one-shot preload observers disconnect themselves |
| Timers | clock, settle, Lenis leftovers | `clearTimeout` / `clearInterval` |
| Running tweens | count-up, counter | `controls.stop()` |
| Large DOM | loader images | Loader returns `null` after the wipe |

**Verified** with Playwright by soft-navigating away from `/` (via a temporary test route, since removed). Results: 7/7 videos detached, `src` removed, paused, `networkState = 0` (NETWORK_EMPTY, decoder released), placeholder removed, and the `<html>` Lenis classes cleaned.

---

## 8. Performance notes (where the rebuild beats the original)

1. **Word reveal:** one CSS variable per frame instead of N React renders per scroll event.
2. **Shimmer:** one shared keyframe instead of a `<style>` tag per instance.
3. **Loader wipe:** WAAPI `clip-path` instead of an animated `mask-image` gradient.
4. **Count-up / counter:** direct DOM writes or MotionValue children, so no renders.
5. **Video:** zero bytes until near the viewport. Off-screen or inactive clips are paused. Stacked service clips decode one at a time. Everything is disposed on unmount. Measured at first paint: **1 of 7** videos had a `src`.
6. **Morph:** rAF-coalesced, read-then-write, half-pixel skip, parked when off screen, `contain`.
7. **Lens gallery:** zero per-frame JS, with paint culling of fully clipped fixed layers.
8. **Nav tone / chapters / ring:** IntersectionObserver instead of scroll listeners.
9. **Clock:** 1 render per minute, aligned to the minute boundary.
10. **Breakpoints:** CSS-hidden parallel trees, the same as Framer. No hydration mismatch, and hidden media never loads.
11. **Bundle:** route 74 kB plus 103 kB shared = **177 kB first load**, statically prerendered.

Not measured: frame timings on real low-end phones. Headless Chromium has no GPU, so profile on a device before launch.

---

## 9. Implementation table

| File | Kind | What it implements | Key technique |
| --- | --- | --- | --- |
| `src/styles/tokens.css` | CSS | All brand tokens, 3 breakpoints | Custom properties |
| `src/lib/motion.ts` | TS | Springs, eases, intro timeline, menu/hover values | Values lifted from the live JSON |
| `src/types/content.ts` | TS | Content model | Discriminated union `HeroSegment` |
| `src/content/site.ts` | TS | Placeholder content (ASCII-only) | `\u` escapes |
| `src/lib/media.ts` | TS | `pickVideoSource`, `disposeVideo` | `canPlayType`, pipeline reset |
| `src/lib/refs.ts` | TS | `useMergedRefs` | React 19 ref cleanup |
| `src/hooks/useRafCallback.ts` | TS | Per-frame coalescing | rAF + cancel on unmount |
| `src/hooks/useMediaQuery.ts` | TS | SSR-safe media queries | `useSyncExternalStore` |
| `providers/SmoothScrollProvider.tsx` | client | Lenis | Original options, leftover-class guard |
| `providers/IntroProvider.tsx` | client | Shared intro clock | Context + reduced-motion compression |
| `morph/VideoMorph.tsx` | client | **Clip -> reel morph** | Lerped fixed geometry, placeholder, parked mode |
| `media/LazyVideo.tsx` | client | Background video | 2 IOs, `active` gate, disposal |
| `ui/GlassButton.tsx` | server-safe | Glass pill (a/button) | 4 layers, 6 inset shadows |
| `ui/TextShimmer.tsx` | server-safe | Shimmer | Shared keyframe + CSS vars |
| `ui/LiveClock.tsx` | client | Clock | Minute-aligned timer, `shortOffset` |
| `ui/CountUp.tsx` | client | Count-up | `animate()` -> textContent |
| `ui/ScrollRevealText.tsx` | client | Word reveal | CSS `clamp()` per word, 1 var per frame |
| `ui/BackToTop.tsx` | client | Back to top | `lenis.scrollTo` |
| `sections/Loader.tsx` | client | Intro | Springs, MotionValue counter, clip-path wipe |
| `sections/Nav.tsx` | client | Header + menu | Tone IO, variants stagger, focus mgmt |
| `sections/Hero.tsx` | client | Hero | Per-segment fade, parallax, inline media |
| `sections/Playreel.tsx` + `ReelModal.tsx` | client | Reel | Converge transforms, native `<dialog>` |
| `sections/About.tsx` | client | About + facts | `whileInView`, AnimatePresence |
| `sections/Services.tsx` | client | Sticky chapters | Center-line IO, active-gated video |
| `sections/Testimonials.tsx` | client | Testimonials | Single sticky unit + `trackRef` |
| `sections/TemplatesGallery.tsx` + `PaginationRing.tsx` | client | Lens gallery | clip-path + fixed, culling, SVG ring |
| `sections/Faq.tsx` | client | Accordion | Height auto, unmounted panels |
| `sections/CtaFooter.tsx` | server | Curtain footer | sticky + progressive backdrop blur |
| `app/page.tsx`, `app/layout.tsx` | server | Composition, fonts | Providers wrap the tree |

The complete code for every file is in **Appendix A**.

---

## 10. Usage example

To reuse the signature morph and the word reveal on another page, for example a Throughline case study, without the intro:

```tsx
// src/app/work/[slug]/page.tsx
import type { JSX } from 'react';
import { site } from '@/content/site';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { IntroProvider } from '@/components/providers/IntroProvider';
import { VideoMorphProvider } from '@/components/morph/VideoMorph';
import { Hero } from '@/components/sections/Hero';
import { Playreel } from '@/components/sections/Playreel';
import { ScrollRevealText } from '@/components/ui/ScrollRevealText';

export default function CaseStudy(): JSX.Element {
  return (
    <SmoothScrollProvider intensity={16 /* 1.6 s - a touch snappier */}>
      <IntroProvider enabled={false /* no loader: entrances play immediately */}>
        <VideoMorphProvider>
          <Hero content={site.hero} timeZone="Asia/Karachi" />
          <Playreel content={site.playreel} />
          <section data-nav-tone="light" style={{ padding: '20vh 40px', minHeight: '150vh' }}>
            <ScrollRevealText
              text="We rebuilt the launch site in three weeks and doubled demo requests."
              revealDistance={600}
              initialOpacity={0.15}
              className="t-h3"
            />
          </section>
        </VideoMorphProvider>
      </IntroProvider>
    </SmoothScrollProvider>
  );
}
```

Rules to keep the morph working anywhere:

- The source `<video>` must have no transformed, filtered or `opacity < 1` ancestor while it is morphing.
- The target must be on screen when `p` reaches 1.
- Any UI that should sit above the clip needs `z-index > 8`.

---

## 11. Run, customize, ship

```bash
npm install && npm run dev
npm run typecheck && npm run build && npm start
python3 scripts/generate-placeholders.py   # regenerate placeholder media (Pillow + ffmpeg)
```

- **Content:** `src/content/site.ts`. **Look:** `src/styles/tokens.css`. **Feel:** `src/lib/motion.ts`.
- **Video:** provide WebM VP9 plus MP4 H.264 for every clip, and keep hero/service clips at 6-10 s, 720p, under about 1.5 MB. To mirror Kota, serve Mux renditions per breakpoint (270p / 480p / 1080p).
- **Font:** license TWK Lausanne (or keep Inter Tight), add `@font-face` and point `--font-sans` at it.
- **Legal:** this repo reproduces *techniques*, not Kota Studio's copy, imagery or video. Keep it that way in production.

---

## 12. Verification performed

| Check | Result |
| --- | --- |
| `tsc --noEmit` (strict) | Pass |
| `next build` | Pass. Static, 177 kB first load |
| Desktop 1440x900 scroll-through (37 frames) | All sections render. Morph lands exactly on the reel (`left 0, top 0, 1440x900` at p = 1) |
| Hero container transform after entrance | `none`, so the fixed clip is not re-anchored |
| Menu a11y | Focus moves to the first link on open and back to the trigger on Escape |
| Lens hit-testing at slide boundary | Top half -> slide 0, bottom half -> slide 1; hover scales only the visible lens |
| Reel modal | Opens, Lenis stopped, video playing; Escape closes, Lenis resumes, video removed |
| Phone 390x844 | No horizontal overflow (scrollWidth 390); morph disabled; stacked services |
| `prefers-reduced-motion` | No Lenis, loader gone in under 1 s, reveals at 100% |
| Unmount disposal | 7/7 videos released (`networkState 0`), placeholder removed, `<html>` classes clean |
| Console errors | None |

---

## Appendix A: Complete source

Every file in `src/` is listed below, in reading order. The same files ship in the zip.

### `package.json`

```json
{
  "name": "kota-rebuild",
  "version": "1.0.0",
  "private": true,
  "description": "Faithful TypeScript rebuild of the madebykota.com interaction system (Next.js 15 + Motion + Lenis).",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fontsource-variable/inter-tight": "5.3.0",
    "lenis": "1.3.26",
    "motion": "12.43.0",
    "next": "15.5.27",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@types/node": "22.20.5",
    "@types/react": "19.2.18",
    "@types/react-dom": "19.2.7",
    "typescript": "5.9.3"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `next.config.ts`

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Lint runs in CI/editor; keep `next build` focused on types + bundling.
  eslint: { ignoreDuringBuilds: true },
  images: {
    // AVIF first, WebP fallback: ~30-50% smaller than JPEG for the big template scenes.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 828, 1200, 1920, 2560],
  },
};

export default nextConfig;
```

### `src/styles/tokens.css`

```css
/*
 * Centralized brand tokens. Every color, type size, radius, shadow and z-layer
 * used by the components lives here. Values are lifted from the live site's
 * Framer tokens (see TEARDOWN.md, "Design tokens").
 */
:root {
  /* ---- Color ---------------------------------------------------------- */
  --c-canvas: #efefef;            /* light page background */
  --c-ink: rgba(0, 0, 0, 0.96);   /* primary text on light */
  --c-ink-muted: #656565;
  --c-ink-faint: rgba(0, 0, 0, 0.08);
  --c-night: #000000;             /* dark sections */
  --c-paper: rgba(255, 255, 255, 0.96); /* primary text on dark */
  --c-paper-muted: rgba(255, 255, 255, 0.6);
  --c-paper-faint: rgba(255, 255, 255, 0.15);
  --c-card: #ffffff;
  --c-accent: #042db4;            /* deep blue accent */
  --c-hairline-dark: rgba(255, 255, 255, 0.2);
  --c-hairline-light: rgba(0, 0, 0, 0.14);

  /* ---- Typography ----------------------------------------------------- */
  /* Original uses TWK Lausanne (commercial). Inter Tight is the free stand-in;
     drop your licensed font into --font-sans and nothing else changes. */
  --font-sans: 'Inter Tight Variable', 'Inter Tight', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --fw-light: 300;
  --fw-regular: 400;
  --fw-medium: 500;

  /* size / line-height / tracking triplets (desktop) */
  --t-display-size: 88px;  --t-display-lh: 96px;  --t-display-ls: -0.03em;
  --t-h1-size: 72px;       --t-h1-lh: 80px;       --t-h1-ls: -0.03em;
  --t-h2-size: 56px;       --t-h2-lh: 64px;       --t-h2-ls: -0.03em;
  --t-h3-size: 44px;       --t-h3-lh: 52px;       --t-h3-ls: -0.02em;
  --t-h4-size: 36px;       --t-h4-lh: 44px;       --t-h4-ls: -0.02em;
  --t-h5-size: 28px;       --t-h5-lh: 36px;       --t-h5-ls: -0.01em;
  --t-lead-size: 20px;     --t-lead-lh: 28px;     --t-lead-ls: -0.005em;
  --t-body-size: 16px;     --t-body-lh: 24px;     --t-body-ls: -0.005em;
  --t-small-size: 14px;    --t-small-lh: 20px;    --t-small-ls: -0.005em;
  --t-micro-size: 12px;    --t-micro-lh: 16px;    --t-micro-ls: -0.005em;

  /* ---- Layout --------------------------------------------------------- */
  --gutter: 40px;
  --max-w: 1920px;
  --radius-sm: 12px;
  --radius-md: 20px;
  --radius-pill: 999px;

  /* ---- Glass ("liquid glass" buttons + menu) -------------------------- */
  --glass-blur: 10px;
  --glass-fill-dark: rgba(255, 255, 255, 0.08);
  --glass-fill-light: rgba(255, 255, 255, 0.55);
  --glass-ring-dark: 0 0 0 1px rgba(255, 255, 255, 0.14);
  --glass-ring-light: 1px 0 0 0 rgba(0, 0, 0, 0.14), -1px 0 0 0 rgba(0, 0, 0, 0.14),
    0 0 0 1px rgba(0, 0, 0, 0.14), 0 8px 16px 0 rgba(0, 0, 0, 0.02);
  --glass-highlights: inset 0 4px 1px -4px #fff, inset 0 -4px 1px -4px #fff,
    inset 0 1px 0 0 rgba(255, 255, 255, 0.88), inset 0 -1px 0 0 rgba(255, 255, 255, 0.88),
    inset 0 40px 10px -40px rgba(255, 255, 255, 0.96), inset 0 -40px 10px -40px rgba(255, 255, 255, 0.96);
  --glass-inner-shadow-dark: inset 20px 0 20px -30px rgba(0, 0, 0, 0.3), inset -20px 0 20px -30px rgba(0, 0, 0, 0.3);
  --glass-inner-shadow-light: inset 20px 0 20px -30px rgba(0, 0, 0, 0.12),
    inset -20px 0 20px -30px rgba(0, 0, 0, 0.12), inset 0 40px 30px -40px rgba(0, 0, 0, 0.08);

  /* ---- Motion (CSS side; JS side lives in src/lib/motion.ts) ---------- */
  --ease-out-soft: cubic-bezier(0.12, 0.23, 0.5, 1);
  --ease-in-out-film: cubic-bezier(0.3, 0, 0.2, 1);
  --dur-fast: 150ms;
  --dur-base: 250ms;

  /* ---- Z layers (one place, no magic numbers in components) ----------- */
  --z-base: 1;
  --z-morph-video: 7;
  --z-morph-overlay: 8;
  --z-section-ui: 9;
  --z-nav: 50;
  --z-menu: 60;
  --z-modal: 90;
  --z-loader: 100;
}

/* Tablet: 810-1199 */
@media (max-width: 1199.98px) {
  :root {
    --gutter: 24px;
    --t-display-size: 64px; --t-display-lh: 72px;
    --t-h1-size: 56px;      --t-h1-lh: 64px;
    --t-h2-size: 44px;      --t-h2-lh: 52px;
    --t-h4-size: 28px;      --t-h4-lh: 36px;
  }
}

/* Phone: < 810 */
@media (max-width: 809.98px) {
  :root {
    --gutter: 16px;
    --t-display-size: 40px; --t-display-lh: 44px;
    --t-h1-size: 48px;      --t-h1-lh: 56px;
    --t-h2-size: 36px;      --t-h2-lh: 44px;
    --t-h3-size: 32px;      --t-h3-lh: 40px;
    --t-h4-size: 24px;      --t-h4-lh: 32px;
    --t-h5-size: 22px;      --t-h5-lh: 28px;
  }
}
```

### `src/app/globals.css`

```css
@import '../styles/tokens.css';

/* ---- Lenis (inlined: the package does not export its stylesheet) ------- */
html.lenis,
html.lenis body { height: auto; }
.lenis:not(.lenis-autoToggle).lenis-stopped { overflow: clip; }
.lenis [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-smooth iframe { pointer-events: none; }

/* ---- Reset ------------------------------------------------------------- */
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body {
  margin: 0;
  background: var(--c-canvas);
  color: var(--c-ink);
  font-family: var(--font-sans);
  font-weight: var(--fw-regular);
  font-size: var(--t-body-size);
  line-height: var(--t-body-lh);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
h1, h2, h3, h4, p, figure, blockquote, dl, dd { margin: 0; }
h1, h2, h3, h4 { font-weight: var(--fw-regular); }
ul, ol { margin: 0; padding: 0; list-style: none; }
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
img, video { display: block; max-width: 100%; }
img { -webkit-user-drag: none; }  /* the original injects the same rule via a plugin */
:focus-visible { outline: 2px solid var(--c-accent); outline-offset: 3px; }

/* ---- Utilities --------------------------------------------------------- */
.sr-only {
  position: absolute !important;
  width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
.t-micro { font-size: var(--t-micro-size); line-height: var(--t-micro-lh); letter-spacing: var(--t-micro-ls); }
.t-small { font-size: var(--t-small-size); line-height: var(--t-small-lh); letter-spacing: var(--t-small-ls); }
.t-lead  { font-size: var(--t-lead-size);  line-height: var(--t-lead-lh);  letter-spacing: var(--t-lead-ls); font-weight: var(--fw-light); }
.t-h5    { font-size: var(--t-h5-size);    line-height: var(--t-h5-lh);    letter-spacing: var(--t-h5-ls); }
.t-h4    { font-size: var(--t-h4-size);    line-height: var(--t-h4-lh);    letter-spacing: var(--t-h4-ls); }
.t-h3    { font-size: var(--t-h3-size);    line-height: var(--t-h3-lh);    letter-spacing: var(--t-h3-ls); }
.t-h2    { font-size: var(--t-h2-size);    line-height: var(--t-h2-lh);    letter-spacing: var(--t-h2-ls); }
.t-h1    { font-size: var(--t-h1-size);    line-height: var(--t-h1-lh);    letter-spacing: var(--t-h1-ls); }
.t-display { font-size: var(--t-display-size); line-height: var(--t-display-lh); letter-spacing: var(--t-display-ls); }

/* Breakpoint visibility - same strategy as Framer's `hidden-<hash>` classes:
   render both trees on the server (no hydration mismatch), hide with CSS.
   display:none trees never intersect, so their lazy videos never load. */
@media (max-width: 809.98px) { .only-desktop { display: none !important; } }
@media (min-width: 810px)    { .only-phone   { display: none !important; } }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

### `src/lib/motion.ts`

```ts
import type { Transition } from 'motion/react';

/**
 * Motion tokens. Every value here was read out of the live site's
 * `__framer__appearAnimationsContent` JSON and page chunks (see TEARDOWN.md).
 * Components import from here so the whole site retimes from one file.
 */

/** Framer's default "smooth" spring: stiffness 400, damping 100, mass 1.
 *  Damping ratio = 100 / (2 * sqrt(400 * 1)) = 2.5 -> heavily over-damped,
 *  so it settles with zero overshoot. Reads as a fast ease-out, not a bounce. */
export const SPRING_SMOOTH: Transition = { type: 'spring', stiffness: 400, damping: 100, mass: 1 };

/** Menu link stagger + hover scale on template images. */
export const EASE_OUT_SOFT = [0.12, 0.23, 0.5, 1] as const;

/** Loader mask wipe. The 1.01 end overshoot keeps the edge from stalling at 100%. */
export const EASE_FILM = [0.3, 0, 0.2, 1.01] as const;

/** Count-up and general reveals. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const INTRO = {
  /** First card launches at 0.5 s, then every 0.15 s (last one capped at 1.5 s). */
  cardDelays: [0.5, 0.65, 0.8, 0.95, 1.1, 1.25, 1.4, 1.5] as const,
  /** Start offsets: alternate right/left, converging toward center, all from 1000 px below. */
  cardOffsetsX: [600, -550, 500, -450, 400, -350, 300, -250] as const,
  cardOffsetY: 1000,
  /** Loader flips to its exit variant at 3.25 s. */
  exitAt: 3.25,
  wipeDuration: 1.25,
  /** Hero content (y: 100 -> 0) starts at the exit; nav + scroll cue at 3.5 s. */
  heroDelay: 3.25,
  chromeDelay: 3.5,
} as const;

export const MENU = {
  linkY: 12,
  linkDuration: 0.18,
  stagger: 0.05,
} as const;

export const HOVER = {
  imageScale: 1.05,
  imageDuration: 0.15,
} as const;

/** Lenis: the Framer "Smooth Scroll" component maps intensity -> duration / 10. Site uses 20 -> 2.0 s. */
export const SMOOTH_SCROLL_INTENSITY = 20;
```

### `src/lib/media.ts`

```ts
import type { VideoSource } from '@/types/content';

/** First source the browser reports it can decode ('probably' | 'maybe'); falls back to the first. */
export function pickVideoSource(sources: readonly VideoSource[], probe?: HTMLVideoElement): string | null {
  if (typeof document === 'undefined') return sources[0]?.src ?? null;
  const el = probe ?? document.createElement('video');
  for (const s of sources) if (el.canPlayType(s.type) !== '') return s.src;
  return sources[0]?.src ?? null;
}

/**
 * Release a media element's decoder and buffers right now instead of at GC.
 * The DOM equivalent of geometry.dispose() / texture.dispose() in three.js.
 */
export function disposeVideo(el: HTMLVideoElement | null): void {
  if (!el) return;
  el.pause();
  el.removeAttribute('src');
  el.load();
}
```

### `src/lib/refs.ts`

```ts
import { useCallback, type Ref, type RefCallback } from 'react';

/**
 * Merges several refs into one callback ref (React 19 style, returns a cleanup).
 * Memoized on the ref identities so React does not detach/re-attach every render.
 */
export function useMergedRefs<T>(...refs: ReadonlyArray<Ref<T> | undefined>): RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    (node: T | null) => {
      const cleanups: Array<() => void> = refs.map((ref) => {
        if (typeof ref === 'function') {
          const result = ref(node);
          return typeof result === 'function' ? result : () => ref(null);
        }
        if (ref && typeof ref === 'object') {
          (ref as { current: T | null }).current = node;
          return () => {
            (ref as { current: T | null }).current = null;
          };
        }
        return () => undefined;
      });
      return () => cleanups.forEach((fn) => fn());
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs,
  );
}
```

### `src/types/content.ts`

```ts
/** Content model. Everything the page renders is typed here and filled in src/content/site.ts. */

export interface VideoSource {
  src: string;
  /** MIME type incl. codecs when you know them, e.g. 'video/webm; codecs="vp9"'. */
  type: string;
}

export interface MediaVideo {
  sources: readonly VideoSource[];
  poster?: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface NavLink {
  label: string;
  href: string;
  disabled?: boolean;
}

/** Hero headline rows are a list of typed segments so media can sit inline with words. */
export type HeroSegment =
  | { kind: 'text'; text: string }
  | { kind: 'video' }               // the inline clip that morphs into the play-reel
  | { kind: 'icon'; src: string; alt: string }
  | { kind: 'gap' };                // fixed-width breathing room inside a row

export type HeroRow = readonly HeroSegment[];

export interface Fact {
  label: string;
  value: number;
  suffix: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  timeline: string;
  deliverables: string;
  description: string;
  priceFrom: string;
  video: MediaVideo;
}

export interface Testimonial {
  quote: string;
  author: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  price: string;
  href: string;
  background: ImageAsset;
  lens: ImageAsset;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface SiteContent {
  brand: { name: string; wordmark: string; email: string; timeZone: string };
  nav: { links: readonly NavLink[]; socials: readonly NavLink[]; cta: NavLink };
  intro: { images: readonly ImageAsset[] };
  hero: {
    badge: string;
    availability: string;
    seoTitle: string;
    rows: readonly HeroRow[];
    tagline: { strong: string; rest: string };
    background: ImageAsset;
    video: MediaVideo;
  };
  playreel: { duration: string; year: string; video: MediaVideo };
  about: { label: string; statement: string; facts: readonly Fact[] };
  services: { label: string; items: readonly Service[] };
  testimonials: readonly Testimonial[];
  templates: { label: string; items: readonly TemplateItem[]; allHref: string };
  faq: { title: string; askLabel: string; items: readonly FaqItem[] };
  cta: { title: string; button: NavLink };
  footer: { credits: readonly string[] };
}
```

### `src/content/site.ts`

```ts
import type { ImageAsset, MediaVideo, SiteContent } from '@/types/content';

/*
 * Placeholder content. Structure mirrors the reference site; copy and media are
 * neutral stand-ins (do not ship another studio's copy or work).
 * Source files stay ASCII-only: typographic characters use \u escapes.
 */

const EM_DASH = '\u2014';

const video = (name: string): MediaVideo => ({
  // Order matters: LazyVideo picks the first type the browser can decode.
  sources: [
    { src: `/media/video/${name}.webm`, type: 'video/webm; codecs="vp9"' },
    { src: `/media/video/${name}.mp4`, type: 'video/mp4; codecs="avc1.42E01E"' },
  ],
  poster: `/media/video/${name}-poster.jpg`,
});

const introImage = (n: number): ImageAsset => ({
  src: `/media/intro/intro-${String(n).padStart(2, '0')}.jpg`,
  alt: '',
  width: 1200,
  height: 750,
});

export const site: SiteContent = {
  brand: {
    name: 'Your Studio',
    wordmark: 'Your Studio',
    email: 'hello@example.com',
    timeZone: 'Asia/Karachi',
  },
  nav: {
    links: [
      { label: 'Home', href: '/' },
      { label: 'Work', href: '#templates' },
      { label: 'Insights (Soon)', href: '#', disabled: true },
    ],
    socials: [
      { label: 'X (Twitter)', href: 'https://x.com' },
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'Threads', href: 'https://threads.net' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
    ],
    cta: { label: 'Get in touch', href: 'mailto:hello@example.com' },
  },
  intro: { images: [1, 2, 3, 4, 5, 6, 7, 8].map(introImage) },
  hero: {
    badge: 'Independent design studio',
    availability: 'Available for new projects',
    seoTitle: `Turning ideas into high ${EM_DASH} impact websites`,
    rows: [
      [{ kind: 'text', text: 'Turning ideas' }, { kind: 'gap' }, { kind: 'text', text: 'into' }],
      [{ kind: 'video' }, { kind: 'text', text: `high ${EM_DASH} impact` }],
      [{ kind: 'text', text: 'Motion' }, { kind: 'icon', src: '/media/spark.svg', alt: '' }, { kind: 'text', text: 'websites' }],
    ],
    tagline: { strong: 'Your Studio', rest: 'creates motion-rich, interactive websites that engage users and boost conversions.' },
    background: { src: '/media/hero-bg.jpg', alt: '', width: 2400, height: 1350 },
    video: video('reel'),
  },
  playreel: { duration: '[ 00:06 ]', year: '\u00a92026', video: video('reel') },
  about: {
    label: 'About',
    statement:
      `You have already built something great. Whether it is just taking shape or already scaling ${EM_DASH} it deserves a website that matches the work you have put in.`,
    facts: [
      { label: 'Projects completed', value: 15, suffix: '+', description: 'Websites designed and shipped for founders, SaaS teams and agencies.' },
      { label: 'Average launch time', value: 3, suffix: ' wks', description: 'From kickoff call to a live, production-ready site.' },
      { label: 'Client retention', value: 92, suffix: '%', description: 'Most clients come back for the next launch.' },
    ],
  },
  services: {
    label: 'Our Services',
    items: [
      {
        id: 'landing',
        name: 'Landing Page',
        timeline: '1-2 weeks',
        deliverables: '1 page',
        description: 'A single page built to earn its traffic. For launches, campaigns and paid ads. Conversion-led and shipped fast.',
        priceFrom: '$4,000',
        video: video('service-1'),
      },
      {
        id: 'marketing',
        name: 'Marketing Site',
        timeline: '4-6 weeks',
        deliverables: '5+ pages',
        description: 'A full website that tells your story and guides visitors through the right journey: Home, Product, Pricing, About.',
        priceFrom: '$6,000',
        video: video('service-2'),
      },
      {
        id: 'motion',
        name: 'Motion Design',
        timeline: '1-2 weeks',
        deliverables: 'Video, explainer or animation',
        description: 'Motion that makes your product feel alive. Launch videos, explainers and animation systems for your site.',
        priceFrom: '$3,000',
        video: video('service-3'),
      },
    ],
  },
  testimonials: [
    {
      quote:
        '"The final website turned out exactly as I envisioned it. Communication was excellent throughout; the team was quick to respond, clear about what was going on, and worked hard to hit our goals."',
      author: `${EM_DASH} Client Name, Company`,
    },
    {
      quote:
        '"They helped us from the ground up, refining and carefully building an eye-catching landing page with wonderful animations, themes and font selections. Everything shows expertise."',
      author: `${EM_DASH} Client Name, Company`,
    },
    {
      quote:
        '"Professional, dedicated and thoughtful. Meticulous about every detail and genuinely invested in the product. We will keep working together on the next projects."',
      author: `${EM_DASH} Client Name, Company`,
    },
  ],
  templates: {
    label: 'Featured Work',
    allHref: '#',
    items: ['Orbit', 'Ledger', 'Cortex', 'Atrium', 'Folio'].map((name, i) => ({
      id: name.toLowerCase(),
      name,
      category: ['Agency', 'Finance', 'AI', 'Studio', 'Portfolio'][i] ?? 'Agency',
      price: '$99',
      href: '#',
      background: { src: `/media/templates/tpl-${i + 1}-bg.jpg`, alt: '', width: 2400, height: 1350 },
      lens: { src: `/media/templates/tpl-${i + 1}-lens.jpg`, alt: `${name} preview`, width: 1000, height: 1000 },
    })),
  },
  faq: {
    title: 'Question before you decide.',
    askLabel: 'Ask a question',
    items: [
      { id: 'who', question: 'Who is this for?', answer: 'Founders, SaaS teams and agency owners who need a site that looks like a premium build without the premium timeline.' },
      { id: 'help', question: 'What do you actually help with?', answer: 'Strategy, design, build and launch. One team from first call to live site.' },
      { id: 'build', question: 'Do you design and also build the site?', answer: 'Yes. Design and development happen in-house, so nothing gets lost in hand-off.' },
      { id: 'scratch', question: 'Can you build my site from scratch?', answer: 'Yes. Bring a brief or a blank page; we will shape it together.' },
      { id: 'cost', question: 'How much does it cost?', answer: 'Landing pages start at $4k and marketing sites at $6k. Motion work is quoted by scope.' },
      { id: 'start', question: 'How fast can you start?', answer: 'Usually within one to two weeks of signing.' },
      { id: 'process', question: 'How do we work together day to day?', answer: 'A shared channel, weekly check-ins and a live staging link you can open any time.' },
      { id: 'after', question: 'What happens after the site launches?', answer: 'Two weeks of post-launch support are included, with ongoing care plans available.' },
    ],
  },
  cta: { title: 'Let\u2019s get started!', button: { label: 'Start a project', href: 'mailto:hello@example.com' } },
  footer: { credits: ['Designed by Your Studio', 'Built with Next.js', 'Motion by Motion + Lenis'] },
};
```

### `src/hooks/useRafCallback.ts`

```ts
'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Coalesces any number of calls per frame into ONE call on the next animation frame.
 *
 * Why: scroll events can fire several times per frame (and Lenis emits its own on
 * top of native ones). Doing DOM reads/writes in the handler directly causes layout
 * thrash. Scheduling into rAF guarantees one read-then-write pass per frame.
 *
 * The pending frame is cancelled on unmount, so no callback can run against a
 * detached node.
 */
export function useRafCallback(callback: () => void): { schedule: () => void; cancel: () => void } {
  const frameRef = useRef<number | null>(null);
  const callbackRef = useRef<() => void>(callback);
  callbackRef.current = callback;

  const cancel = useCallback((): void => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const schedule = useCallback((): void => {
    if (frameRef.current !== null) return; // already queued for this frame
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      callbackRef.current();
    });
  }, []);

  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}
```

### `src/hooks/useMediaQuery.ts`

```ts
'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * SSR-safe media query. `serverValue` is what the server (and the first client
 * render) assumes, so hydration never mismatches; the real value arrives right after.
 * useSyncExternalStore subscribes/unsubscribes for us, so there is no listener leak.
 */
export function useMediaQuery(query: string, serverValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = useCallback((): boolean => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback((): boolean => serverValue, [serverValue]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export const BREAKPOINTS = {
  desktop: '(min-width: 1200px)',
  tabletUp: '(min-width: 810px)',
  phone: '(max-width: 809.98px)',
  reducedMotion: '(prefers-reduced-motion: reduce)',
} as const;
```

### `src/components/providers/SmoothScrollProvider.tsx`

```tsx
'use client';

import Lenis from 'lenis';
import { createContext, useContext, useEffect, useState, type JSX, type ReactNode } from 'react';
import { SMOOTH_SCROLL_INTENSITY } from '@/lib/motion';

const LenisContext = createContext<Lenis | null>(null);

/** Module-level count of live instances (StrictMode mounts twice in dev). */
let liveInstances = 0;

/** Access the Lenis instance (null on the server, under reduced motion, or before mount). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext);
}

export interface SmoothScrollProviderProps {
  children: ReactNode;
  /** Framer's Smooth Scroll "intensity". duration = intensity / 10 seconds. */
  intensity?: number;
}

/**
 * Window-level Lenis, configured exactly like the original Framer component
 * (smoothWheel, autoRaf, anchors, allowNestedScroll, stopInertiaOnNavigate).
 *
 * Lenis drives the real window scroll position, so native `scroll` listeners,
 * IntersectionObserver, `position: sticky` and Motion's useScroll all keep working.
 */
export function SmoothScrollProvider({ children, intensity = SMOOTH_SCROLL_INTENSITY }: SmoothScrollProviderProps): JSX.Element {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    // Respect the OS setting: no inertia at all, plain native scrolling.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const instance = new Lenis({
      duration: intensity / 10,
      smoothWheel: true,
      autoRaf: true,            // Lenis owns its rAF loop; destroy() cancels it.
      anchors: true,            // in-page #links get smooth-scrolled
      allowNestedScroll: true,  // inner scrollers (menus, modals) keep native scroll
      stopInertiaOnNavigate: true,
    });
    liveInstances += 1;
    setLenis(instance);

    return () => {
      // Disposal: cancels the rAF loop, removes wheel/touch/resize listeners,
      // the ResizeObserver, and the `lenis*` classes on <html>.
      instance.destroy();
      liveInstances -= 1;
      setLenis(null);
      // Observed in testing (lenis 1.3.26): when a scroll lands during a soft
      // navigation, the 400 ms velocity-reset timer re-adds `lenis` to <html>
      // after destroy(). Strip leftovers once, unless a new instance is alive.
      window.setTimeout(() => {
        if (liveInstances > 0) return;
        const root = document.documentElement;
        Array.from(root.classList)
          .filter((c) => c === 'lenis' || c.startsWith('lenis-'))
          .forEach((c) => root.classList.remove(c));
      }, 500);
    };
  }, [intensity]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
```

### `src/components/providers/IntroProvider.tsx`

```tsx
'use client';

import { useReducedMotion } from 'motion/react';
import { createContext, useCallback, useContext, useMemo, useState, type JSX, type ReactNode } from 'react';
import { INTRO } from '@/lib/motion';

export interface IntroState {
  /** Loader starts its exit wipe at this many seconds. */
  exitAt: number;
  /** Seconds to wait before the hero plays its entrance (0 when the loader is skipped). */
  heroDelay: number;
  /** Nav + scroll cue entrance. */
  chromeDelay: number;
  /** True once the loader has fully left the screen. */
  done: boolean;
  markDone: () => void;
}

const IntroContext = createContext<IntroState>({
  exitAt: 0,
  heroDelay: 0,
  chromeDelay: 0,
  done: true,
  markDone: () => undefined,
});

export function useIntro(): IntroState {
  return useContext(IntroContext);
}

export interface IntroProviderProps {
  children: ReactNode;
  /** When false the loader is skipped and every entrance plays immediately. */
  enabled?: boolean;
}

/**
 * One shared clock for the intro. The loader and the hero never talk to each
 * other directly; both read their delays from here, so the timeline
 * (loader exit 3.25 s -> hero 3.25 s -> chrome 3.5 s) lives in one place.
 * Under prefers-reduced-motion the whole intro compresses to well under a second.
 */
export function IntroProvider({ children, enabled = true }: IntroProviderProps): JSX.Element {
  const reduce = useReducedMotion() ?? false;
  const [done, setDone] = useState<boolean>(!enabled);
  const markDone = useCallback((): void => setDone(true), []);

  const value = useMemo<IntroState>(() => {
    if (!enabled) return { exitAt: 0, heroDelay: 0, chromeDelay: 0, done: true, markDone };
    if (reduce) return { exitAt: 0.3, heroDelay: 0.4, chromeDelay: 0.5, done, markDone };
    return { exitAt: INTRO.exitAt, heroDelay: INTRO.heroDelay, chromeDelay: INTRO.chromeDelay, done, markDone };
  }, [enabled, reduce, done, markDone]);

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}
```

### `src/components/morph/VideoMorph.tsx`

```tsx
'use client';

import { useReducedMotion } from 'motion/react';
import { createContext, useContext, useEffect, useMemo, useRef, type JSX, type ReactNode, type RefObject } from 'react';
import { BREAKPOINTS, useMediaQuery } from '@/hooks/useMediaQuery';
import styles from './VideoMorph.module.css';

/*
 * THE signature effect: the 142 px clip sitting inside the hero headline detaches
 * and grows, in lock-step with scroll, until it exactly covers the play-reel
 * section below. Reverse-engineered from the custom code component on the live
 * site (it looks up #hero-video, #playreel-video and #hero-video-overlay):
 *
 *   p    = clamp((viewportHeight - target.top) / viewportHeight, 0, 1)
 *   rect = lerp(restRect, target.getBoundingClientRect(), p)
 *   video -> position: fixed at `rect`;  overlay -> same rect, opacity = p
 *
 * restRect is the clip's box at p = 0, cached. A hidden placeholder of the same
 * size is inserted so the headline does not reflow when the clip leaves it.
 */

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  left: lerp(a.left, b.left, t),
  top: lerp(a.top, b.top, t),
  width: lerp(a.width, b.width, t),
  height: lerp(a.height, b.height, t),
});
const toRect = (r: DOMRect): Rect => ({ left: r.left, top: r.top, width: r.width, height: r.height });

export interface UseVideoMorphOptions {
  sourceRef: RefObject<HTMLVideoElement | null>;
  targetRef: RefObject<HTMLElement | null>;
  overlayRef: RefObject<HTMLElement | null>;
  enabled: boolean;
}

export function useVideoMorph({ sourceRef, targetRef, overlayRef, enabled }: UseVideoMorphOptions): void {
  useEffect(() => {
    const source = sourceRef.current;
    const target = targetRef.current;
    const overlay = overlayRef.current;
    if (!enabled || !source || !target) return;

    const sourceStyle = source.getAttribute('style'); // restored verbatim on deactivate
    let restRect: Rect | null = null;
    let placeholder: HTMLDivElement | null = null;
    let active = false;
    let parked = false; // clip already pinned to a target that is fully above the viewport
    let frame: number | null = null;
    let lastKey = '';

    const deactivate = (): void => {
      if (!active) return;
      active = false;
      parked = false;
      lastKey = '';
      if (sourceStyle === null) source.removeAttribute('style');
      else source.setAttribute('style', sourceStyle);
      placeholder?.remove();
      placeholder = null;
      if (overlay) overlay.style.cssText = '';
    };

    const activate = (rest: Rect): void => {
      if (active) return;
      active = true;
      placeholder = document.createElement('div');
      placeholder.setAttribute('aria-hidden', 'true');
      placeholder.style.cssText = `width:${rest.width}px;height:${rest.height}px;visibility:hidden;pointer-events:none;flex:none;`;
      source.insertAdjacentElement('afterend', placeholder);
      // Static part of the style is written once, not per frame.
      Object.assign(source.style, {
        position: 'fixed',
        margin: '0',
        maxWidth: 'none',
        maxHeight: 'none',
        transform: 'none',
        objectFit: 'cover',
        pointerEvents: 'none',
        zIndex: 'var(--z-morph-video)',
        contain: 'layout paint', // re-layout stays inside the video box
        willChange: 'left, top, width, height',
      } satisfies Partial<CSSStyleDeclaration>);
      if (overlay) overlay.style.display = 'block';
    };

    const update = (): void => {
      frame = null;
      // ---- READ phase (one layout read per frame) ----
      const vh = window.innerHeight;
      const targetBox = toRect(target.getBoundingClientRect());
      const p = vh <= 0 ? 0 : Math.min(1, Math.max(0, (vh - targetBox.top) / vh));

      if (p <= 0) {
        deactivate();
        restRect = toRect(source.getBoundingClientRect()); // fresh rest box while docked
        return;
      }
      if (!restRect) restRect = toRect(source.getBoundingClientRect());

      // Once the reel has scrolled completely out above the viewport, the clip is
      // invisible: write its final box once, then skip all work until it returns.
      const aboveViewport = targetBox.top + targetBox.height <= 0;
      if (aboveViewport && parked && active) return;
      parked = aboveViewport;

      // ---- WRITE phase ----
      const r = lerpRect(restRect, targetBox, p);
      // Skip the write if nothing moved by at least half a pixel (Lenis settles slowly).
      const key = `${Math.round(r.left * 2)}|${Math.round(r.top * 2)}|${Math.round(r.width * 2)}|${Math.round(r.height * 2)}`;
      if (key === lastKey && active) return;
      lastKey = key;

      activate(restRect);
      const s = source.style;
      s.left = `${r.left}px`;
      s.top = `${r.top}px`;
      s.width = `${Math.max(0, r.width)}px`;
      s.height = `${Math.max(0, r.height)}px`;
      if (overlay) {
        const o = overlay.style;
        o.left = s.left;
        o.top = s.top;
        o.width = s.width;
        o.height = s.height;
        o.opacity = p.toFixed(3); // gradient darkens as the clip becomes the reel backdrop
      }
    };

    // rAF-coalesced: many scroll events per frame -> one update per frame.
    const schedule = (): void => {
      if (frame === null) frame = requestAnimationFrame(update);
    };
    const reset = (): void => {
      deactivate();
      restRect = null;
      schedule();
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', reset);
    window.addEventListener('orientationchange', reset);
    // Fonts/images can shift the headline after first paint: re-measure once things settle.
    const settle = window.setTimeout(reset, 150);
    schedule();

    return () => {
      // Full teardown: listeners, pending frame, timer, injected placeholder, inline styles.
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', reset);
      window.removeEventListener('orientationchange', reset);
      window.clearTimeout(settle);
      if (frame !== null) cancelAnimationFrame(frame);
      deactivate();
    };
  }, [enabled, sourceRef, targetRef, overlayRef]);
}

/* ------------------------------------------------------------------------- */
/* Provider: lets Hero (source) and Playreel (target) register without ids.   */
/* ------------------------------------------------------------------------- */

interface VideoMorphContextValue {
  sourceRef: RefObject<HTMLVideoElement | null>;
  targetRef: RefObject<HTMLDivElement | null>;
  /** True when the morph is running (tablet/desktop, motion allowed). */
  enabled: boolean;
}

const VideoMorphContext = createContext<VideoMorphContextValue | null>(null);

export function useVideoMorphRefs(): VideoMorphContextValue {
  const ctx = useContext(VideoMorphContext);
  if (!ctx) throw new Error('useVideoMorphRefs must be used inside <VideoMorphProvider>');
  return ctx;
}

export interface VideoMorphProviderProps {
  children: ReactNode;
}

export function VideoMorphProvider({ children }: VideoMorphProviderProps): JSX.Element {
  const sourceRef = useRef<HTMLVideoElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const tabletUp = useMediaQuery(BREAKPOINTS.tabletUp, false);
  const reduce = useReducedMotion() ?? false;
  // The live site also skips the morph on phones (the phone hero uses a separate clip).
  const enabled = tabletUp && !reduce;

  useVideoMorph({ sourceRef, targetRef, overlayRef, enabled });

  const value = useMemo<VideoMorphContextValue>(() => ({ sourceRef, targetRef, enabled }), [enabled]);

  return (
    <VideoMorphContext.Provider value={value}>
      {children}
      <div ref={overlayRef} className={styles.overlay} aria-hidden="true" />
    </VideoMorphContext.Provider>
  );
}
```

### `src/components/morph/VideoMorph.module.css`

```css
/* Follows the morphing clip; gradient matches the original "Faded Overlay". */
.overlay {
  display: none;
  position: fixed;
  z-index: var(--z-morph-overlay);
  pointer-events: none;
  opacity: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.45) 49.7%, rgba(0, 0, 0, 0.08) 100%);
  contain: strict;
}
```

### `src/components/media/LazyVideo.tsx`

```tsx
'use client';

import { useEffect, useRef, type JSX, type Ref, type VideoHTMLAttributes } from 'react';
import { disposeVideo, pickVideoSource } from '@/lib/media';
import { useMergedRefs } from '@/lib/refs';
import type { MediaVideo } from '@/types/content';

export interface LazyVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'children' | 'poster'> {
  video: MediaVideo;
  /**
   * Extra gate on playback. A clip plays only while it is on screen AND active.
   * Use it for stacked clips (services) so only the visible one decodes.
   */
  active?: boolean;
  /** How far ahead of the viewport to start downloading. */
  preloadMargin?: string;
  ref?: Ref<HTMLVideoElement>;
}

/**
 * Muted, looping background video with a strict lifecycle:
 *  - `preload="none"` + no src in the markup: zero bytes until it nears the viewport.
 *  - one observer attaches the src ~1 screen early, then disconnects itself.
 *  - a second observer tracks visibility; off-screen or inactive = paused (no decode cost).
 *  - on unmount it is fully disposed (see cleanup): the video analogue of
 *    geometry.dispose() / texture.dispose() in WebGL.
 */
export function LazyVideo({ video, active = true, preloadMargin = '100% 0px', ref, ...rest }: LazyVideoProps): JSX.Element {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const setRefs = useMergedRefs<HTMLVideoElement>(localRef, ref);
  const visibleRef = useRef<boolean>(false);
  const activeRef = useRef<boolean>(active);
  const attachedRef = useRef<boolean>(false);

  /** Single place that decides play vs pause. */
  const sync = (el: HTMLVideoElement): void => {
    if (visibleRef.current && activeRef.current) {
      if (!attachedRef.current) {
        const src = pickVideoSource(video.sources, el);
        if (!src) return;
        el.src = src; // set imperatively: React never owns `src`, so disposal is safe
        attachedRef.current = true;
      }
      // play() rejects if the element is detached mid-load or autoplay is blocked; both benign.
      el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  };

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    attachedRef.current = false;

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (!attachedRef.current) {
          const src = pickVideoSource(video.sources, el);
          if (src) {
            el.src = src;
            attachedRef.current = true;
          }
        }
        preloadObserver.disconnect(); // one-shot
      },
      { rootMargin: preloadMargin },
    );

    const visibilityObserver = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      visibleRef.current = entry.isIntersecting;
      sync(el);
    });

    preloadObserver.observe(el);
    visibilityObserver.observe(el);

    return () => {
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
      visibleRef.current = false;
      attachedRef.current = false;
      // Disposal: pause, drop the source and reset the media pipeline, which
      // releases the decoder and its frame buffers now instead of at GC.
      disposeVideo(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video, preloadMargin]);

  // React to the `active` gate without re-creating observers.
  useEffect(() => {
    activeRef.current = active;
    if (localRef.current) sync(localRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <video
      ref={setRefs}
      poster={video.poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      {...rest}
    />
  );
}
```

### `src/components/ui/GlassButton.tsx`

```tsx
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, JSX, ReactNode, Ref } from 'react';
import styles from './GlassButton.module.css';

export type GlassTone = 'dark' | 'light';
export type GlassSize = 'sm' | 'md' | 'icon';

interface GlassBaseProps {
  tone?: GlassTone;
  size?: GlassSize;
  children: ReactNode;
  className?: string;
}

export type GlassAnchorProps = GlassBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof GlassBaseProps | 'href'> & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
  };

export type GlassNativeButtonProps = GlassBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof GlassBaseProps> & {
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
  };

export type GlassButtonProps = GlassAnchorProps | GlassNativeButtonProps;

/** Four stacked layers, named after the original Framer layers. All decorative. */
function Layers(): JSX.Element {
  return (
    <>
      <span className={styles.fill} aria-hidden="true" />
      <span className={styles.fog} aria-hidden="true" />
      <span className={styles.inner} aria-hidden="true" />
      <span className={styles.highlights} aria-hidden="true" />
    </>
  );
}

/**
 * "Liquid glass" pill. Pure CSS: backdrop blur + six inset shadows for the rim light,
 * so hover/press only animate `opacity` and `transform` (compositor-only, no repaint
 * of the blur region on every frame).
 * Renders an <a> when `href` is given, otherwise a <button>. Server-component safe.
 */
export function GlassButton(props: GlassButtonProps): JSX.Element {
  const tone: GlassTone = props.tone ?? 'dark';
  const size: GlassSize = props.size ?? 'md';
  const cls = [styles.root, styles[tone], styles[size], props.className].filter(Boolean).join(' ');

  if (props.href !== undefined) {
    const { tone: _t, size: _s, className: _c, children, ref, ...anchorRest } = props;
    return (
      <a ref={ref} className={cls} {...anchorRest}>
        <Layers />
        <span className={styles.label}>{children}</span>
      </a>
    );
  }

  const { tone: _t, size: _s, className: _c, children, ref, type, ...buttonRest } = props;
  return (
    <button ref={ref} type={type ?? 'button'} className={cls} {...buttonRest}>
      <Layers />
      <span className={styles.label}>{children}</span>
    </button>
  );
}
```

### `src/components/ui/GlassButton.module.css`

```css
.root {
  position: relative;
  isolation: isolate;               /* own stacking context: layers can't leak z-index */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  font-size: var(--t-small-size);
  line-height: var(--t-small-lh);
  font-weight: var(--fw-medium);
  white-space: nowrap;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform var(--dur-base) var(--ease-out-soft);
}
.root:active { transform: scale(0.97); }

.sm   { height: 36px; padding: 0 18px; }
.md   { height: 44px; padding: 0 24px; }
.icon { height: 36px; width: 36px; padding: 0; }

.fill, .fog, .inner, .highlights {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

/* 1. fill + shadow: the frosted body. backdrop-filter is the expensive layer,
      so it is never animated; only its siblings change on hover. */
.fill {
  z-index: -4;
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
}
/* 2. fog: a soft wash that thickens on hover (opacity only). */
.fog {
  z-index: -3;
  opacity: 0;
  transition: opacity var(--dur-base) var(--ease-out-soft);
}
/* 3. inner shadow: side vignettes that give the pill its "curved" depth. */
.inner { z-index: -2; }
/* 4. highlights: thin bright rims top and bottom (six stacked inset shadows). */
.highlights {
  z-index: -1;
  box-shadow: var(--glass-highlights);
  opacity: 0.55;
  transition: opacity var(--dur-base) var(--ease-out-soft);
}

.label { position: relative; display: inline-flex; align-items: center; gap: 8px; }

/* ---- tones ---- */
.dark { color: var(--c-paper); }
.dark .fill  { background: var(--glass-fill-dark); box-shadow: var(--glass-ring-dark); }
.dark .fog   { background: rgba(255, 255, 255, 0.12); }
.dark .inner { box-shadow: var(--glass-inner-shadow-dark); }
.dark .highlights { opacity: 0.22; }

.light { color: var(--c-ink); }
.light .fill  { background: var(--glass-fill-light); box-shadow: var(--glass-ring-light); }
.light .fog   { background: rgba(255, 255, 255, 0.7); }
.light .inner { box-shadow: var(--glass-inner-shadow-light); }

@media (hover: hover) {
  .root:hover .fog { opacity: 1; }
  .root:hover .highlights { opacity: 0.9; }
  .dark:hover .highlights { opacity: 0.4; }
}
```

### `src/components/ui/TextShimmer.tsx`

```tsx
import type { CSSProperties, JSX } from 'react';
import styles from './TextShimmer.module.css';

export interface TextShimmerProps {
  text: string;
  /** 1-10. Cycle length = 11 - speed seconds (same mapping as the original component). */
  speed?: number;
  /** 1-100. Width of the bright band as a share of the gradient. */
  size?: number;
  /** Gradient angle in degrees. */
  rotation?: number;
  direction?: 'left' | 'right';
  baseColor?: string;
  shimmerColor?: string;
  as?: 'p' | 'span';
  className?: string;
}

type ShimmerVars = CSSProperties & Record<`--${string}`, string>;

/**
 * Light sweep across text ("Available for new projects").
 *
 * Optimization vs. the original: the Framer component injects a fresh <style> tag
 * with its own @keyframes per instance. Here every instance shares ONE keyframe
 * and is parameterized through CSS custom properties, so N shimmers cost one rule.
 * The animation only moves `background-position` on a clipped text layer.
 */
export function TextShimmer({
  text,
  speed = 8,
  size = 65,
  rotation = 120,
  direction = 'right',
  baseColor = 'rgb(109, 109, 109)',
  shimmerColor = 'rgb(255, 255, 255)',
  as: Tag = 'p',
  className,
}: TextShimmerProps): JSX.Element {
  const band = (size * 30) / 100;
  const vars: ShimmerVars = {
    '--shimmer-duration': `${11 - speed}s`,
    '--shimmer-angle': `${rotation}deg`,
    '--shimmer-from': `${50 - band}%`,
    '--shimmer-to': `${50 + band}%`,
    '--shimmer-color': shimmerColor,
    '--shimmer-start': direction === 'left' ? '-100%' : '200%',
    '--shimmer-end': direction === 'left' ? '200%' : '-100%',
    color: baseColor,
  };

  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')} style={vars}>
      <Tag className={styles.base}>{text}</Tag>
      <Tag className={styles.sweep} aria-hidden="true">
        {text}
      </Tag>
    </span>
  );
}
```

### `src/components/ui/TextShimmer.module.css`

```css
.root { position: relative; display: inline-block; user-select: none; }
.base { margin: 0; }
.sweep {
  position: absolute;
  inset: 0;
  margin: 0;
  color: transparent;
  pointer-events: none;
  background: linear-gradient(
    var(--shimmer-angle),
    transparent 0%,
    transparent var(--shimmer-from),
    var(--shimmer-color) 50%,
    transparent var(--shimmer-to),
    transparent 100%
  );
  background-size: 200% 200%;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  animation: shimmer var(--shimmer-duration) linear infinite;
}
@keyframes shimmer {
  from { background-position: var(--shimmer-start); }
  to   { background-position: var(--shimmer-end); }
}
@media (prefers-reduced-motion: reduce) { .sweep { display: none; } }
```

### `src/components/ui/LiveClock.tsx`

```tsx
'use client';

import { useEffect, useMemo, useState, type JSX } from 'react';

export interface LiveClockProps {
  timeZone: string;
  hour12?: boolean;
  className?: string;
  offsetClassName?: string;
}

function formatTime(date: Date, timeZone: string, hour12: boolean): string {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12, timeZone }).format(date);
}

/** "GMT+5" -> "(GMT +5)" - the spacing the original uses. */
function formatOffset(date: Date, timeZone: string): string {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'shortOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName');
  const raw = part?.value ?? 'GMT';
  return `(${raw.replace(/^GMT/, 'GMT ').trim()})`;
}

/**
 * Studio-local clock. Renders nothing time-specific on the server (server time !=
 * visitor time -> hydration mismatch), then ticks on the client.
 *
 * Optimization: instead of a 1 s interval (60 renders/min for a minute display),
 * it sleeps until the next minute boundary, then ticks every 60 s. Both timers are
 * cleared on unmount.
 */
export function LiveClock({ timeZone, hour12 = true, className, offsetClassName }: LiveClockProps): JSX.Element {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    let interval: ReturnType<typeof setInterval> | undefined;
    const msToNextMinute = 60_000 - (Date.now() % 60_000);
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      if (interval !== undefined) clearInterval(interval);
    };
  }, []);

  const offset = useMemo<string>(() => (now ? formatOffset(now, timeZone) : ''), [now, timeZone]);

  return (
    <p className={className}>
      <time dateTime={now?.toISOString()}>{now ? formatTime(now, timeZone, hour12) : '\u00a0'}</time>{' '}
      <span className={offsetClassName}>{offset}</span>
    </p>
  );
}
```

### `src/components/ui/CountUp.tsx`

```tsx
'use client';

import { animate, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, type JSX } from 'react';
import { EASE_OUT_EXPO } from '@/lib/motion';

export interface CountUpProps {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

/**
 * Number that counts up when it enters the viewport (and again whenever `value`
 * changes, e.g. when the facts slider moves).
 *
 * Optimization: the tween writes straight to `textContent` in `onUpdate` -
 * no React state, so 60 updates/s cause 0 re-renders. The animation is stopped
 * on unmount / value change so it can never write into a detached node.
 */
export function CountUp({ value, suffix = '', duration = 1.6, className }: CountUpProps): JSX.Element {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();

  // Server HTML carries the real number (SEO, no-JS). Once hydrated, rewind to 0
  // while still off screen so the count-up has somewhere to start from.
  useEffect(() => {
    if (!reduce && !inView && ref.current) ref.current.textContent = `0${suffix}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = `${value}${suffix}`;
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT_EXPO,
      onUpdate: (v: number) => {
        el.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix, duration, reduce]);

  return (
    <span className={className}>
      <span ref={ref} aria-hidden="true">{`${value}${suffix}`}</span>
      <span className="sr-only">{`${value}${suffix}`}</span>
    </span>
  );
}
```

### `src/components/ui/ScrollRevealText.tsx`

```tsx
'use client';

import { useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useRef, type CSSProperties, type JSX, type RefObject } from 'react';
import { useRafCallback } from '@/hooks/useRafCallback';
import styles from './ScrollRevealText.module.css';

export interface ScrollRevealTextProps {
  text: string;
  /** Scroll distance (px) over which every word goes from dim to solid. Original: 800. */
  revealDistance?: number;
  /** Opacity of not-yet-revealed words. Original testimonials: 0.2. */
  initialOpacity?: number;
  /** Blur (px) of not-yet-revealed words. 0 disables the filter entirely (cheaper). */
  initialBlur?: number;
  /** Reveal starts when the wrapper's top reaches this fraction of the viewport height. */
  start?: number;
  /** Keep the text pinned while its (taller) wrapper scrolls past. */
  sticky?: boolean;
  /**
   * Element whose scroll position drives the reveal. Defaults to the component's
   * own wrapper. Pass the scrolling parent when the text sits inside a sticky
   * container (a stuck element's rect stops moving, which would freeze progress).
   */
  trackRef?: RefObject<HTMLElement | null>;
  stickyTop?: string;
  className?: string;
}

type RevealVars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * Word-by-word scroll reveal (testimonials).
 *
 * Optimization vs. the original Framer component, which calls setState on every
 * scroll event and re-renders every word span:
 *  1. ONE CSS custom property (--p, 0..1) is written per frame on the wrapper.
 *     Each word derives its own opacity in CSS from --p, its index --i and the
 *     word count --n, so React never re-renders while scrolling.
 *  2. Writes are rAF-coalesced and skipped when --p has not changed.
 *  3. The scroll listener only exists while the block is on screen
 *     (IntersectionObserver attaches/detaches it).
 *  4. blur() is opt-in: filters force a paint per word, so blur 0 = no filter at all.
 */
export function ScrollRevealText({
  text,
  revealDistance = 800,
  initialOpacity = 0.2,
  initialBlur = 0,
  start = 0.8,
  sticky = true,
  stickyTop = '30vh',
  trackRef,
  className,
}: ScrollRevealTextProps): JSX.Element {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const lastProgress = useRef<number>(-1);
  const reduce = useReducedMotion();
  const words = useMemo<string[]>(() => text.split(/\s+/).filter(Boolean), [text]);

  const { schedule, cancel } = useRafCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const tracked = trackRef?.current ?? el;
    const rect = tracked.getBoundingClientRect(); // single read per frame
    const raw = (window.innerHeight * start - rect.top) / revealDistance;
    const p = Math.min(1, Math.max(0, raw));
    if (Math.abs(p - lastProgress.current) < 0.001) return; // nothing visible changed
    lastProgress.current = p;
    el.style.setProperty('--p', p.toFixed(4)); // single write per frame
  });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (reduce) {
      el.style.setProperty('--p', '1');
      return;
    }

    const onScroll = (): void => schedule();
    let listening = false;
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      if (visible && !listening) {
        window.addEventListener('scroll', onScroll, { passive: true });
        listening = true;
        schedule();
      } else if (!visible && listening) {
        window.removeEventListener('scroll', onScroll);
        listening = false;
        schedule(); // settle at 0 or 1 on exit
      }
    });
    io.observe(trackRef?.current ?? el);
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancel();
    };
  }, [reduce, schedule, cancel, trackRef]);

  const vars: RevealVars = {
    '--p': 0,
    '--n': words.length,
    '--o0': initialOpacity,
    '--b0': initialBlur,
    '--sticky-top': stickyTop,
  };

  return (
    <div ref={wrapperRef} className={styles.wrapper} style={vars}>
      <p className={[styles.text, sticky ? styles.sticky : '', className].filter(Boolean).join(' ')}>
        <span className="sr-only">{text}</span>
        <span aria-hidden="true">
          {words.map((word, i) => (
            <span
              key={`${i}-${word}`}
              className={initialBlur > 0 ? `${styles.word} ${styles.blur}` : styles.word}
              style={{ '--i': i } as RevealVars}
            >
              {word}
            </span>
          ))}
        </span>
      </p>
    </div>
  );
}
```

### `src/components/ui/ScrollRevealText.module.css`

```css
.wrapper { position: relative; height: 100%; }
.text { margin: 0; }
.sticky { position: sticky; top: var(--sticky-top); }

/* local progress of word i: 0 before its turn, 1 after, linear in between */
.word {
  --local: clamp(0, var(--p) * var(--n) - var(--i), 1);
  display: inline-block;
  margin-right: 0.25em;
  opacity: calc(var(--o0) + (1 - var(--o0)) * var(--local));
  /* the original eases each word with a 0.2 s transition; it also smooths Lenis' steps */
  transition: opacity 0.2s ease-out, filter 0.2s ease-out;
}
.blur { filter: blur(calc(var(--b0) * (1 - var(--local)) * 1px)); }
```

### `src/components/ui/BackToTop.tsx`

```tsx
'use client';

import type { JSX } from 'react';
import { useLenis } from '@/components/providers/SmoothScrollProvider';
import { GlassButton } from './GlassButton';

export interface BackToTopProps {
  className?: string;
}

/** Uses Lenis when present (same easing as wheel scrolling), native smooth scroll otherwise. */
export function BackToTop({ className }: BackToTopProps): JSX.Element {
  const lenis = useLenis();
  return (
    <GlassButton
      tone="dark"
      size="icon"
      className={className}
      aria-label="Back to top"
      onClick={() => {
        if (lenis) lenis.scrollTo(0, { duration: 2 });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      <span aria-hidden="true">{'\u2191'}</span>
    </GlassButton>
  );
}
```

### `src/components/sections/Loader.tsx`

```tsx
'use client';

import Image from 'next/image';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, type JSX } from 'react';
import { useIntro } from '@/components/providers/IntroProvider';
import { useLenis } from '@/components/providers/SmoothScrollProvider';
import { EASE_FILM, INTRO, SPRING_SMOOTH } from '@/lib/motion';
import type { ImageAsset } from '@/types/content';
import styles from './Loader.module.css';

export interface LoaderProps {
  images: readonly ImageAsset[];
  brand: string;
}

/**
 * Intro sequence (0 -> ~4.5 s):
 *  0.50-1.50 s  eight project shots spring up from 1000 px below, alternating
 *               right/left offsets that shrink toward center, and stack.
 *  0 -> exit    percentage counter runs.
 *  3.25 s       hard-edged wipe from the bottom up reveals the hero underneath.
 *  ~4.5 s       loader unmounts (images + nodes released), scroll unlocks.
 */
export function Loader({ images, brand }: LoaderProps): JSX.Element | null {
  const { done, markDone, exitAt } = useIntro();
  const lenis = useLenis();
  const reduce = useReducedMotion() ?? false;

  // Counter lives in a MotionValue and is rendered as a motion child:
  // ~200 text updates with zero React re-renders.
  const progress = useMotionValue<number>(0);
  const label = useTransform(progress, (v: number) => `${Math.round(v)}%`);

  // Scroll lock while the loader is up. Lenis is created after mount, so this
  // effect re-runs when it appears and stops it immediately.
  useEffect(() => {
    if (done) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    lenis?.stop();
    return () => {
      root.style.overflow = '';
      lenis?.start();
    };
  }, [done, lenis]);

  useEffect(() => {
    if (done) return;
    const controls = animate(progress, 100, { duration: Math.max(0.2, exitAt - 0.2), ease: [0.65, 0, 0.35, 1] });
    return () => controls.stop();
  }, [done, exitAt, progress]);

  if (done) return null; // unmount = every image, node and animation released

  return (
    <motion.div
      className={styles.root}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${brand}`}
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      // Same hard-edged bottom-up wipe as the original's animated mask-image gradient,
      // but clip-path is on Motion's hardware-accelerated list (runs via WAAPI) and
      // needs no offscreen mask texture.
      transition={{ delay: exitAt, duration: reduce ? 0.3 : INTRO.wipeDuration, ease: EASE_FILM }}
      onAnimationComplete={markDone}
    >
      <div className={styles.meta}>
        <span>0%</span>
        <span>{brand}</span>
        <motion.span className={styles.counter}>{label}</motion.span>
      </div>

      <div className={styles.stage} aria-hidden="true">
        {images.map((img, i) => (
          <motion.div
            key={img.src}
            className={styles.card}
            style={{ zIndex: i + 1 }}
            // transformTemplate keeps the -50%/-50% centering in the same transform
            // string as the animated x/y, exactly like Framer's
            // "translate(-50%, -50%) __Appear_Animation_Transform__".
            transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
            initial={reduce ? false : { x: INTRO.cardOffsetsX[i] ?? 0, y: INTRO.cardOffsetY }}
            animate={{ x: 0, y: 0 }}
            transition={{ ...SPRING_SMOOTH, delay: INTRO.cardDelays[i] ?? 1.5 }}
          >
            <Image src={img.src} alt="" fill sizes="(max-width: 809px) 70vw, 600px" priority={i < 4} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
```

### `src/components/sections/Loader.module.css`

```css
.root {
  position: fixed;
  inset: 0;
  z-index: var(--z-loader);
  background: var(--c-night);
  color: var(--c-paper);
  overflow: hidden;
  will-change: clip-path; /* promoted for the 1.25 s wipe only; the node unmounts after */
}
.meta {
  position: absolute;
  inset: 50% var(--gutter) auto;
  display: flex;
  justify-content: space-between;
  transform: translateY(-50%);
  font-size: var(--t-micro-size);
  line-height: var(--t-micro-lh);
  z-index: 0;
}
.counter { font-variant-numeric: tabular-nums; min-width: 4ch; text-align: right; }
.stage { position: absolute; inset: 0; z-index: 1; }
.card {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(600px, 70vw);
  aspect-ratio: 1.6;
  overflow: hidden;
  background: #111;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
  will-change: transform;
}
.card img { object-fit: cover; }
@media (max-width: 1199.98px) { .card { width: min(500px, 70vw); } }
```

### `src/components/sections/Nav.tsx`

```tsx
'use client';

import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useCallback, useEffect, useId, useRef, useState, type JSX } from 'react';
import { useIntro } from '@/components/providers/IntroProvider';
import { GlassButton, type GlassTone } from '@/components/ui/GlassButton';
import { EASE_OUT_SOFT, MENU, SPRING_SMOOTH } from '@/lib/motion';
import type { NavLink } from '@/types/content';
import styles from './Nav.module.css';

export interface NavProps {
  brand: string;
  links: readonly NavLink[];
  socials: readonly NavLink[];
  cta: NavLink;
}

const listVariants: Variants = {
  closed: {},
  open: { transition: { staggerChildren: MENU.stagger } },
};

const itemVariants: Variants = {
  closed: { opacity: 0, y: MENU.linkY },
  open: { opacity: 1, y: 0, transition: { duration: MENU.linkDuration, ease: EASE_OUT_SOFT } },
};

/**
 * Fixed glass header. Two behaviours worth noting:
 *  - Tone switching: every top-level section declares data-nav-tone="dark|light".
 *    One IntersectionObserver watches a thin band at the top of the viewport and
 *    flips the glass between dark/light variants. No scroll listener at all.
 *  - Menu: glass dropdown from the center button; links stagger in 50 ms apart
 *    (y 12 -> 0, 180 ms). Escape / outside click close it and focus returns to the trigger.
 */
export function Nav({ brand, links, socials, cta }: NavProps): JSX.Element {
  const { chromeDelay } = useIntro();
  const [tone, setTone] = useState<GlassTone>('dark');
  const [open, setOpen] = useState<boolean>(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  // --- tone detection -------------------------------------------------------
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-tone]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const value = entry.target.getAttribute('data-nav-tone');
          if (value === 'dark' || value === 'light') setTone(value);
        }
      },
      // A 5%-tall band at the very top: only the section *under the header* counts.
      { rootMargin: '0px 0px -95% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // --- menu a11y: escape, outside click, focus management ----------------------
  const close = useCallback((returnFocus: boolean): void => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close(true);
    };
    const onPointer = (e: PointerEvent): void => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, close]);

  return (
    <motion.header
      className={styles.header}
      data-tone={tone}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SMOOTH, delay: chromeDelay }}
    >
      <div className={styles.left}>
        <GlassButton href="/" tone={tone} size="sm" className={styles.brand} aria-label={`${brand} home`}>
          {brand}
        </GlassButton>
      </div>

      <div className={styles.center}>
        <GlassButton
          ref={triggerRef}
          tone={tone}
          size="icon"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.burger} data-open={open} aria-hidden="true">
            <span />
            <span />
          </span>
        </GlassButton>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              id={menuId}
              className={styles.panel}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE_OUT_SOFT }}
            >
              <motion.ul variants={listVariants} initial="closed" animate="open" className={styles.links}>
                {links.map((link, i) => (
                  <motion.li key={link.label} variants={itemVariants}>
                    <a
                      ref={i === 0 ? firstLinkRef : undefined}
                      href={link.disabled ? undefined : link.href}
                      aria-disabled={link.disabled || undefined}
                      className={styles.link}
                      onClick={() => close(false)}
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.ul variants={listVariants} initial="closed" animate="open" className={styles.socials}>
                {socials.map((s) => (
                  <motion.li key={s.label} variants={itemVariants}>
                    <a href={s.href} target="_blank" rel="noreferrer noopener">
                      {s.label}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.right}>
        <GlassButton href={cta.href} tone={tone} size="sm">
          {cta.label}
        </GlassButton>
      </div>
    </motion.header>
  );
}
```

### `src/components/sections/Nav.module.css`

```css
.header {
  position: fixed;
  inset: 0 0 auto;
  z-index: var(--z-nav);
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 11px 20px;
  pointer-events: none; /* only the buttons are interactive; the strip never blocks clicks */
}
.header > * { pointer-events: auto; }
.left { justify-self: start; }
.center { justify-self: center; position: relative; }
.right { justify-self: end; }
.brand { font-size: 18px; letter-spacing: -0.02em; padding: 0 16px; }

.burger { position: relative; width: 12px; height: 8px; display: block; }
.burger span {
  position: absolute; left: 0; right: 0; height: 1.5px; border-radius: 2px;
  background: currentColor;
  transition: transform var(--dur-base) var(--ease-out-soft), top var(--dur-base) var(--ease-out-soft);
}
.burger span:first-child { top: 1px; }
.burger span:last-child { top: 5.5px; }
.burger[data-open='true'] span:first-child { top: 3.25px; transform: rotate(45deg); }
.burger[data-open='true'] span:last-child { top: 3.25px; transform: rotate(-45deg); }

.panel {
  position: absolute;
  top: calc(100% + 10px);
  left: 50%;
  translate: -50% 0;          /* `translate` property: does not collide with Motion's transform */
  z-index: var(--z-menu);
  width: 280px;
  padding: 20px;
  border-radius: var(--radius-md);
  color: var(--c-paper);
  background: rgba(20, 20, 20, 0.55);
  -webkit-backdrop-filter: blur(20px) saturate(140%);
  backdrop-filter: blur(20px) saturate(140%);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1), var(--glass-inner-shadow-dark), 0 24px 60px rgba(0, 0, 0, 0.35);
  transform-origin: top center;
}
.links li + li { border-top: 1px solid rgba(255, 255, 255, 0.1); }
.link {
  display: block;
  padding: 12px 0;
  font-size: var(--t-h5-size);
  line-height: var(--t-h5-lh);
  letter-spacing: var(--t-h5-ls);
  font-weight: var(--fw-light);
  transition: opacity var(--dur-fast) var(--ease-out-soft);
}
.link[aria-disabled='true'] { opacity: 0.45; cursor: default; }
@media (hover: hover) { .link:not([aria-disabled='true']):hover { opacity: 0.6; } }
.socials {
  display: flex; flex-wrap: wrap; gap: 6px 14px;
  margin-top: 12px; padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: var(--t-micro-size); color: var(--c-paper-muted);
}

@media (max-width: 809.98px) {
  .header { grid-template-columns: 1fr auto auto; gap: 8px; padding: 10px 16px; }
  .center { order: 3; }
  .panel { left: auto; right: 0; translate: 0 0; width: min(320px, calc(100vw - 32px)); transform-origin: top right; }
}
```

### `src/components/sections/Hero.tsx`

```tsx
'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef, type JSX } from 'react';
import { LazyVideo } from '@/components/media/LazyVideo';
import { useVideoMorphRefs } from '@/components/morph/VideoMorph';
import { useIntro } from '@/components/providers/IntroProvider';
import { LiveClock } from '@/components/ui/LiveClock';
import { TextShimmer } from '@/components/ui/TextShimmer';
import { SPRING_SMOOTH } from '@/lib/motion';
import type { HeroRow, HeroSegment, SiteContent } from '@/types/content';
import styles from './Hero.module.css';

export interface HeroProps {
  content: SiteContent['hero'];
  timeZone: string;
}

interface SegmentProps {
  segment: HeroSegment;
  fade: MotionValue<number>;
  video: SiteContent['hero']['video'];
}

/**
 * IMPORTANT for the morph: the scroll fade is applied to each TEXT segment, never
 * to a wrapper around the video slot. An ancestor with opacity < 1 would fade the
 * fixed-position clip too (fixed elements still paint inside their ancestors'
 * stacking contexts), and an ancestor transform would re-anchor `position: fixed`.
 */
function Segment({ segment, fade, video }: SegmentProps): JSX.Element {
  const { sourceRef } = useVideoMorphRefs();
  switch (segment.kind) {
    case 'text':
      return <motion.span className={styles.word} style={{ opacity: fade }}>{segment.text}</motion.span>;
    case 'gap':
      return <span className={styles.gap} />;
    case 'icon':
      return (
        <motion.span className={styles.icon} style={{ opacity: fade }}>
          {/* decorative inline glyph: plain img, no layout shift (explicit size) */}
          <img src={segment.src} alt={segment.alt} width={64} height={64} />
        </motion.span>
      );
    case 'video':
      return (
        <span className={styles.videoSlot}>
          <LazyVideo ref={sourceRef} video={video} className={styles.video} preloadMargin="0px" />
        </span>
      );
  }
}

/**
 * Hero: dark, full viewport. Layers (back to front):
 *  1. blurred "wall of work" image with parallax (moves at 25% of scroll) + fade-out
 *  2. right-aligned three-row headline with an inline clip and an inline icon
 *  3. bottom bar: studio clock / tagline / "Scroll for more" cue
 * Entrance waits for the loader (heroDelay); scroll-out fades every text layer.
 */
export function Hero({ content, timeZone }: HeroProps): JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { heroDelay, chromeDelay } = useIntro();

  // Motion's useScroll uses a native ScrollTimeline where supported, so these
  // opacity/transform mappings can run off the main thread.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const fade = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={sectionRef} className={styles.hero} data-nav-tone="dark" aria-labelledby="hero-title">
      <motion.div className={styles.bg} style={{ y: bgY, opacity: bgOpacity }} aria-hidden="true">
        <Image
          src={content.background.src}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={70}
          className={styles.bgImage}
        />
      </motion.div>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: heroDelay }}
      >
        <motion.p className={styles.badge} style={{ opacity: fade }}>
          <img src="/media/spark.svg" alt="" width={12} height={12} />
          {content.badge}
        </motion.p>

        <h1 id="hero-title" className="sr-only">{content.seoTitle}</h1>
        <div className={styles.title} aria-hidden="true">
          {content.rows.map((row: HeroRow, r) => (
            <div key={r} className={styles.row}>
              {row.map((segment, s) => (
                <Segment key={`${r}-${s}`} segment={segment} fade={fade} video={content.video} />
              ))}
            </div>
          ))}
        </div>

        <motion.div className={styles.availability} style={{ opacity: fade }}>
          <TextShimmer text={content.availability} as="span" />
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.bottom}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: chromeDelay }}
      >
        <motion.div className={`${styles.clock} only-desktop`} style={{ opacity: fade }}>
          <LiveClock timeZone={timeZone} className="t-micro" offsetClassName={styles.muted} />
        </motion.div>
        <motion.p className={`${styles.tagline} t-small`} style={{ opacity: fade }}>
          {content.tagline.strong} <span className={styles.muted}>{content.tagline.rest}</span>
        </motion.p>
        <motion.div className={styles.scrollCue} style={{ opacity: fade }} aria-hidden="true">
          <span className={styles.scrollLabel}>
            Scroll <span className={styles.muted}>for more</span>
          </span>
          <span className={styles.scrollTrack}>
            <span className={styles.scrollLine} />
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
```

### `src/components/sections/Hero.module.css`

```css
.hero {
  position: relative;
  height: 100vh;
  min-height: 640px;
  background: var(--c-night);
  color: var(--c-paper);
  overflow: clip;            /* `clip` (not hidden): no scroll container, sticky/fixed children unaffected */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--gutter);
}

.bg { position: absolute; inset: -5% 0 0; z-index: 0; will-change: transform, opacity; }
.bgImage { object-fit: cover; }

/* No z-index here on purpose: a z-index would make .content a stacking context and
   trap the fixed morph clip (z 7) below the play-reel backdrop (z 3). DOM order
   already paints it above .bg. */
.content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-end;     /* the whole headline block is right-aligned */
  gap: 16px;
  margin-top: 6vh;
}

.badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-size: var(--t-micro-size);
  line-height: var(--t-micro-lh);
  background: rgba(255, 255, 255, 0.08);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.title { display: flex; flex-direction: column; align-items: flex-end; }
.row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: var(--t-display-size);
  line-height: var(--t-display-lh);
  letter-spacing: var(--t-display-ls);
  font-weight: var(--fw-regular);
  white-space: nowrap;
}
.word { display: inline-block; }
.gap { display: inline-block; width: 40px; }
.icon { display: inline-flex; width: 0.62em; height: 0.62em; }
.icon img { width: 100%; height: 100%; }

/* 142 px inline clip, 16:9 - the morph source */
.videoSlot { display: inline-flex; flex: none; }
.video {
  width: 142px;
  aspect-ratio: 1.77;
  height: auto;
  object-fit: cover;
  background: #111;
}

.availability { font-size: var(--t-small-size); line-height: var(--t-small-lh); }

.bottom {
  position: absolute;
  inset: auto var(--gutter) 24px;
  z-index: 2;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: end;
}
.clock { justify-self: start; }
.tagline { justify-self: center; text-align: center; max-width: 34ch; }
.muted { color: var(--c-paper-muted); }

.scrollCue { justify-self: end; display: flex; align-items: flex-end; gap: 10px; height: 64px; }
.scrollLabel {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: var(--t-micro-size);
}
.scrollTrack {
  position: relative;
  width: 1px;
  height: 100%;
  background: var(--c-paper-faint);
  overflow: hidden;
}
/* Looping fill that drains downward. transform-only = compositor thread. */
.scrollLine {
  position: absolute;
  inset: 0;
  background: var(--c-paper);
  transform-origin: top;
  animation: scrollCue 2.2s var(--ease-in-out-film) infinite;
}
@keyframes scrollCue {
  0%   { transform: scaleY(0); transform-origin: top; }
  45%  { transform: scaleY(1); transform-origin: top; }
  55%  { transform: scaleY(1); transform-origin: bottom; }
  100% { transform: scaleY(0); transform-origin: bottom; }
}

@media (max-width: 809.98px) {
  .content { align-items: stretch; margin-top: 0; }
  .title { align-items: flex-end; }
  .row { gap: 10px; }
  .video { width: 96px; }
  .gap { width: 16px; }
  .bottom { grid-template-columns: 1fr; justify-items: center; gap: 24px; }
  .scrollCue { order: -1; justify-self: center; }
  .scrollLabel { display: none; }
}
```

### `src/components/sections/Playreel.tsx`

```tsx
'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useCallback, useRef, useState, type JSX } from 'react';
import { LazyVideo } from '@/components/media/LazyVideo';
import { useVideoMorphRefs } from '@/components/morph/VideoMorph';
import type { SiteContent } from '@/types/content';
import { ReelModal } from './ReelModal';
import styles from './Playreel.module.css';

export interface PlayreelProps {
  content: SiteContent['playreel'];
}

/**
 * "PLAY [>] REEL". While the section scrolls from the bottom of the viewport to
 * the top: PLAY slides in from x -300, REEL from x +300, and the button grows
 * 0.5 -> 1 (the original's three onScrollTarget transforms). At the same time the
 * hero clip morphs into this section's backdrop (see VideoMorph).
 */
export function Playreel({ content }: PlayreelProps): JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { targetRef, enabled: morphing } = useVideoMorphRefs();
  const [open, setOpen] = useState<boolean>(false);
  const handleClose = useCallback((): void => setOpen(false), []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'start start'] });
  const playX = useTransform(scrollYProgress, [0, 1], [-300, 0]);
  const reelX = useTransform(scrollYProgress, [0, 1], [300, 0]);
  const buttonScale = useTransform(scrollYProgress, [0, 1], [0.5, 1]);

  return (
    <section ref={sectionRef} className={styles.section} data-nav-tone="dark" aria-label="Showreel">
      {/* Morph target. When the morph is off (phones, reduced motion) it shows its own clip. */}
      <div ref={targetRef} className={styles.backdrop}>
        {!morphing && <LazyVideo video={content.video} className={styles.backdropVideo} />}
        <div className={styles.fade} aria-hidden="true" />
      </div>

      <div className={styles.inner}>
        <div className={styles.cluster}>
          <span className={`${styles.duration} t-micro`}>{content.duration}</span>
          <motion.span className={styles.word} style={{ x: playX }}>PLAY</motion.span>
          <motion.button
            type="button"
            className={styles.play}
            style={{ scale: buttonScale }}
            onClick={() => setOpen(true)}
            aria-label="Play showreel"
            aria-haspopup="dialog"
          >
            <svg viewBox="0 0 12 14" width="12" height="14" aria-hidden="true">
              <path d="M0 0 12 7 0 14Z" fill="currentColor" />
            </svg>
          </motion.button>
          <motion.span className={styles.word} style={{ x: reelX }}>REEL</motion.span>
          <span className={`${styles.year} t-micro`}>{content.year}</span>
        </div>
      </div>

      <ReelModal open={open} onClose={handleClose} video={content.video} title="Showreel" />
    </section>
  );
}
```

### `src/components/sections/Playreel.module.css`

```css
.section {
  position: relative;
  height: 100vh;
  min-height: 560px;
  color: var(--c-paper);
  overflow: clip;
}
.backdrop { position: absolute; inset: 0; z-index: 3; background: var(--c-night); }
.backdropVideo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.45) 49.7%, rgba(0, 0, 0, 0.08) 100%);
}

/* Above the fixed morph clip (z 7) and its overlay (z 8). */
.inner {
  position: relative;
  z-index: var(--z-section-ui);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--gutter);
}
.cluster {
  position: relative;
  display: flex;
  align-items: center;
  gap: clamp(24px, 4vw, 56px);
}
.word {
  font-size: var(--t-h1-size);
  line-height: var(--t-h1-lh);
  letter-spacing: var(--t-h1-ls);
  will-change: transform;
}
.duration { position: absolute; left: 0; top: -22px; color: var(--c-paper-muted); }
.year { position: absolute; right: 0; bottom: -22px; color: var(--c-paper-muted); }
.play {
  display: grid;
  place-items: center;
  width: 80px;
  height: 44px;
  border-radius: var(--radius-pill);
  color: var(--c-paper);
  background: rgba(255, 255, 255, 0.1);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  box-shadow: var(--glass-ring-dark), var(--glass-inner-shadow-dark);
  transition: background-color var(--dur-base) var(--ease-out-soft);
}
@media (hover: hover) { .play:hover { background: rgba(255, 255, 255, 0.2); } }
@media (max-width: 809.98px) { .play { width: 64px; height: 36px; } }
```

### `src/components/sections/ReelModal.tsx`

```tsx
'use client';

import { useEffect, useMemo, useRef, type JSX } from 'react';
import { useLenis } from '@/components/providers/SmoothScrollProvider';
import { disposeVideo, pickVideoSource } from '@/lib/media';
import type { MediaVideo } from '@/types/content';
import styles from './ReelModal.module.css';

export interface ReelModalProps {
  open: boolean;
  onClose: () => void;
  video: MediaVideo;
  title: string;
}

/**
 * Full-screen reel player on the native <dialog>: focus trap, Escape and an inert
 * background come for free from showModal(). Smooth scroll pauses while open.
 * The <video> exists only while open and is disposed when it closes.
 */
export function ReelModal({ open, onClose, video, title }: ReelModalProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lenis = useLenis();
  const src = useMemo<string | null>(() => (open ? pickVideoSource(video.sources) : null), [open, video]);

  // open/close the native dialog in sync with React state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // scroll lock + playback lifecycle, scoped to the open period
  useEffect(() => {
    if (!open) return;
    const el = videoRef.current;
    lenis?.stop();
    el?.play().catch(() => undefined); // may reject if the user closes during load: harmless
    return () => {
      lenis?.start();
      disposeVideo(el);
    };
  }, [open, lenis]);

  // the native 'close' event covers Escape, the close button and backdrop clicks
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close(); // backdrop click
      }}
    >
      {open && src && (
        <video ref={videoRef} className={styles.video} src={src} poster={video.poster} controls playsInline />
      )}
      <button type="button" className={styles.close} onClick={() => dialogRef.current?.close()} aria-label="Close reel">
        <span aria-hidden="true">{'\u00d7'}</span>
      </button>
    </dialog>
  );
}
```

### `src/components/sections/ReelModal.module.css`

```css
.dialog {
  width: min(1280px, 92vw);
  max-width: none;
  padding: 0;
  border: 0;
  border-radius: var(--radius-md);
  background: #000;
  overflow: visible;
}
.dialog::backdrop {
  background: rgba(0, 0, 0, 0.82);
  -webkit-backdrop-filter: blur(6px);
  backdrop-filter: blur(6px);
}
.dialog[open] { animation: pop 0.35s var(--ease-out-soft); }
@keyframes pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
.video { width: 100%; aspect-ratio: 16 / 9; border-radius: inherit; background: #000; }
.close {
  position: absolute;
  top: -48px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: #fff;
  font-size: 22px;
  line-height: 1;
  background: rgba(255, 255, 255, 0.12);
}
```

### `src/components/sections/About.tsx`

```tsx
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState, type JSX } from 'react';
import { CountUp } from '@/components/ui/CountUp';
import { GlassButton } from '@/components/ui/GlassButton';
import { EASE_OUT_SOFT, SPRING_SMOOTH } from '@/lib/motion';
import type { SiteContent } from '@/types/content';
import styles from './About.module.css';

export interface AboutProps {
  content: SiteContent['about'];
}

/**
 * Light "About" block: statement fades up once in view, then a facts slider
 * (prev/next glass arrows) whose big number counts up on view and on every change.
 */
export function About({ content }: AboutProps): JSX.Element {
  const [index, setIndex] = useState<number>(0);
  const total = content.facts.length;
  const fact = content.facts[index];
  const step = (dir: 1 | -1): void => setIndex((i) => (i + dir + total) % total);

  return (
    <section className={styles.section} data-nav-tone="light" aria-labelledby="about-label">
      <div className={styles.statementRow}>
        <p id="about-label" className={`${styles.label} t-micro`}>{content.label}</p>
        <motion.p
          className={`${styles.statement} t-h4`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={SPRING_SMOOTH}
        >
          {content.statement}
        </motion.p>
      </div>

      <div className={styles.facts}>
        <div className={styles.arrows}>
          <GlassButton tone="light" size="icon" aria-label="Previous fact" onClick={() => step(-1)}>
            <span aria-hidden="true">{'\u2190'}</span>
          </GlassButton>
          <GlassButton tone="light" size="icon" aria-label="Next fact" onClick={() => step(1)}>
            <span aria-hidden="true">{'\u2192'}</span>
          </GlassButton>
        </div>

        <div className={styles.factViewport} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {fact && (
              <motion.div
                key={fact.label}
                className={styles.fact}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: EASE_OUT_SOFT }}
              >
                <p className={`${styles.factLabel} t-micro`}>{fact.label}</p>
                <CountUp value={fact.value} suffix={fact.suffix} className={styles.number} />
                <p className={`${styles.factText} t-small`}>{fact.description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className={`${styles.counter} t-micro`} aria-hidden="true">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
      </div>
    </section>
  );
}
```

### `src/components/sections/About.module.css`

```css
.section {
  position: relative;
  background: var(--c-canvas);
  color: var(--c-ink);
  padding: 200px var(--gutter) 160px;
}
.statementRow {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 20px;
  align-items: start;
}
.label { grid-column: 7 / span 1; padding-top: 8px; color: var(--c-ink-muted); }
.statement {
  grid-column: 7 / span 6;
  margin-top: 28px;
  font-weight: var(--fw-light);
}
@media (min-width: 1200px) {
  .label { grid-column: 7 / span 6; }
}

.facts {
  margin-top: 160px;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 20px;
  align-items: end;
}
.arrows { grid-column: 1 / span 2; display: flex; gap: 8px; }
.factViewport { grid-column: 4 / span 8; min-height: 170px; }
.fact { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); column-gap: 20px; align-items: end; }
.factLabel { grid-column: 1 / -1; color: var(--c-ink-muted); margin-bottom: 8px; }
.number {
  font-size: clamp(64px, 8vw, 120px);
  line-height: 1;
  letter-spacing: -0.04em;
  font-variant-numeric: tabular-nums;
}
.factText { max-width: 32ch; padding-bottom: 12px; }
.counter { grid-column: 12; justify-self: end; color: var(--c-ink-muted); padding-bottom: 12px; }

@media (max-width: 809.98px) {
  .section { padding: 120px var(--gutter) 96px; }
  .label, .statement { grid-column: 1 / -1; }
  .statement { margin-top: 12px; }
  .facts { margin-top: 80px; row-gap: 24px; }
  .factViewport { grid-column: 1 / -1; order: -1; }
  .fact { grid-template-columns: 1fr; row-gap: 12px; }
  .arrows { grid-column: 1 / span 6; }
  .counter { grid-column: 7 / -1; }
}
```

### `src/components/sections/Services.tsx`

```tsx
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { LazyVideo } from '@/components/media/LazyVideo';
import { GlassButton } from '@/components/ui/GlassButton';
import { EASE_OUT_SOFT } from '@/lib/motion';
import type { Service, SiteContent } from '@/types/content';
import styles from './Services.module.css';

export interface ServicesProps {
  content: SiteContent['services'];
  contactHref: string;
}

interface ServiceInfoProps {
  service: Service;
  label: string;
  contactHref: string;
}

function ServiceInfo({ service, label, contactHref }: ServiceInfoProps): JSX.Element {
  return (
    <div className={styles.info}>
      <div>
        <p className={`${styles.kicker} t-micro`}>{label}</p>
        <h3 className={`${styles.name} t-h2`}>{service.name}</h3>
      </div>
      <div className={styles.specs}>
        <dl className={styles.specCol}>
          <div>
            <dt className="t-micro">Timeline</dt>
            <dd className="t-micro">{service.timeline}</dd>
          </div>
          <div>
            <dt className="t-micro">Deliverables</dt>
            <dd className="t-micro">{service.deliverables}</dd>
          </div>
        </dl>
        <p className={`${styles.description} t-micro`}>{service.description}</p>
      </div>
      <div className={styles.priceRow}>
        <div>
          <p className={`${styles.kicker} t-micro`}>Starting from</p>
          <p className={`${styles.price} t-h3`}>{service.priceFrom}</p>
        </div>
        <GlassButton tone="light" size="sm" href={contactHref}>
          Start a project
        </GlassButton>
      </div>
    </div>
  );
}

/**
 * Sticky services showcase (desktop/tablet):
 *  - the section is N x 100vh tall; a 100vh stage sticks while you scroll through it
 *  - N invisible 100vh "trigger" blocks sit behind the stage; whichever one crosses
 *    the viewport's center line becomes active (the original uses Framer
 *    "variant appear" targets with threshold 0.5 - same idea)
 *  - left: service details crossfade; right: stacked clips, only the active one plays
 * Phones get a plain stacked list instead (rendered in parallel, hidden by CSS).
 */
export function Services({ content, contactHref }: ServicesProps): JSX.Element {
  const [active, setActive] = useState<number>(0);
  const triggerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const items = content.items;
  const current = items[active] ?? items[0];

  useEffect(() => {
    const nodes = triggerRefs.current.filter((n): n is HTMLDivElement => n !== null);
    // A zero-height band at 50% of the viewport: exactly one trigger intersects it at a time.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(i)) setActive(i);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items.length]);

  const trackStyle: CSSProperties & Record<'--count', number> = { '--count': items.length };

  return (
    <section className={styles.section} data-nav-tone="light" aria-label={content.label}>
      {/* ---------- desktop / tablet: sticky stage ---------- */}
      <div className={`${styles.track} only-desktop`} style={trackStyle}>
        <div className={styles.stage}>
          <div className={styles.infoCol}>
            <AnimatePresence mode="wait" initial={false}>
              {current && (
                <motion.div
                  key={current.id}
                  className={styles.infoMotion}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
                >
                  <ServiceInfo service={current} label={content.label} contactHref={contactHref} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={styles.videoCol}>
            <div className={styles.frame}>
              {items.map((s, i) => (
                <LazyVideo
                  key={s.id}
                  video={s.video}
                  active={i === active}
                  className={styles.clip}
                  data-active={i === active}
                  aria-hidden="true"
                />
              ))}
              <div className={styles.frameShade} aria-hidden="true" />
              <ol className={`${styles.index} t-micro`}>
                {items.map((s, i) => (
                  <li key={s.id} data-active={i === active}>
                    {s.name}
                    <span className={styles.dash} aria-hidden="true">{' \u2014'}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className={styles.triggers} aria-hidden="true">
          {items.map((s, i) => (
            <div
              key={s.id}
              data-index={i}
              className={styles.trigger}
              ref={(node) => {
                triggerRefs.current[i] = node;
              }}
            />
          ))}
        </div>
      </div>

      {/* ---------- phone: stacked cards ---------- */}
      <div className={`${styles.stack} only-phone`}>
        {items.map((s) => (
          <article key={s.id} className={styles.card}>
            <LazyVideo video={s.video} className={styles.cardClip} aria-hidden="true" />
            <ServiceInfo service={s} label={content.label} contactHref={contactHref} />
          </article>
        ))}
      </div>
    </section>
  );
}
```

### `src/components/sections/Services.module.css`

```css
.section { position: relative; background: var(--c-canvas); color: var(--c-ink); }

/* ---- sticky stage ---- */
.track { position: relative; height: calc(var(--count) * 100vh); }
.stage {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.infoCol { position: relative; padding: 96px var(--gutter) 40px; }
.infoMotion { height: 100%; }
.videoCol { padding: 8px 8px 8px 0; height: 100vh; }
.frame {
  position: relative;
  height: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--c-night);
  isolation: isolate;
}
.clip {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.45s var(--ease-out-soft);  /* opacity-only crossfade */
}
.clip[data-active='true'] { opacity: 1; }
.frameShade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(0, 0, 0, 0.45));
  pointer-events: none;
}
.index {
  position: absolute;
  right: 20px;
  bottom: 20px;
  text-align: right;
  color: var(--c-paper);
}
.index li { opacity: 0.55; transition: opacity var(--dur-base) var(--ease-out-soft); }
.index li[data-active='true'] { opacity: 1; }
.dash { display: inline-block; opacity: 0; transition: opacity var(--dur-base) var(--ease-out-soft); }
.index li[data-active='true'] .dash { opacity: 1; }

.triggers { position: absolute; inset: 0; pointer-events: none; }
.trigger { height: 100vh; }

/* ---- shared info block ---- */
/* Two auto margins split the free space: title block floats to ~40% height,
   specs follow it, price pins to the bottom (matches the original's rhythm). */
.info { height: 100%; display: flex; flex-direction: column; max-width: 560px; }
.info > :first-child { margin-top: auto; }
.priceRow { margin-top: auto; }
.kicker { color: var(--c-ink-muted); margin-bottom: 8px; }
.name { margin-top: 8px; }
.specs {
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid var(--c-hairline-light);
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: 20px;
}
.specCol { display: flex; flex-direction: column; gap: 14px; }
.specCol dt { color: var(--c-ink-muted); }
.specCol dd { margin: 2px 0 0; }
.description { max-width: 40ch; }
.priceRow { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; padding-top: 40px; }
.price { letter-spacing: -0.03em; }

/* ---- phone ---- */
.stack { display: flex; flex-direction: column; gap: 64px; padding: 96px var(--gutter); }
.card { display: flex; flex-direction: column; gap: 24px; }
.cardClip { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: var(--radius-md); background: var(--c-night); }
.card .info { height: auto; }
.card .info > :first-child, .card .priceRow { margin-top: 0; }
```

### `src/components/sections/Testimonials.tsx`

```tsx
'use client';

import { useRef, type JSX } from 'react';
import { ScrollRevealText } from '@/components/ui/ScrollRevealText';
import type { Testimonial } from '@/types/content';
import styles from './Testimonials.module.css';

export interface TestimonialsProps {
  items: readonly Testimonial[];
}

interface TestimonialRowProps {
  item: Testimonial;
}

/**
 * One tall (150vh) row. Label, quote and author live in ONE sticky container so
 * they pin and release together. Because that container stops moving while stuck,
 * the reveal is driven by the row (trackRef), which keeps scrolling underneath.
 */
function TestimonialRow({ item }: TestimonialRowProps): JSX.Element {
  const rowRef = useRef<HTMLElement | null>(null);
  return (
    <figure ref={rowRef} className={styles.row}>
      <div className={styles.stick}>
        <p className={`${styles.label} t-micro`}>Testimonial</p>
        <blockquote className={styles.quote}>
          <ScrollRevealText
            text={item.quote}
            trackRef={rowRef}
            sticky={false}
            start={0.7}
            revealDistance={800}
            initialOpacity={0.2}
            className="t-h4"
          />
        </blockquote>
        <figcaption className={`${styles.author} t-micro`}>{item.author}</figcaption>
      </div>
    </figure>
  );
}

/** Testimonials: each quote lights up word by word (dim words at 20% opacity) over ~800 px of scroll. */
export function Testimonials({ items }: TestimonialsProps): JSX.Element {
  return (
    <section className={styles.section} data-nav-tone="light" aria-label="Testimonials">
      {items.map((t, i) => (
        <TestimonialRow key={i} item={t} />
      ))}
    </section>
  );
}
```

### `src/components/sections/Testimonials.module.css`

```css
.section { background: var(--c-canvas); color: var(--c-ink); padding: 10vh var(--gutter) 10vh; }
.row { margin: 0; min-height: 150vh; }
.stick {
  position: sticky;
  top: 28vh;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: 20px;
  align-items: start;
}
.label, .author { color: var(--c-ink-muted); padding-top: 12px; }
.label { grid-column: 1 / span 2; }
.quote { grid-column: 4 / span 6; margin: 0; }
.quote p { font-weight: var(--fw-light); }
.author { grid-column: 11 / span 2; text-align: right; }

@media (max-width: 809.98px) {
  .row { min-height: 110vh; }
  .stick { top: 18vh; grid-template-columns: 1fr; row-gap: 12px; }
  .label, .author, .quote { grid-column: 1; text-align: left; padding-top: 0; }
}
```

### `src/components/sections/TemplatesGallery.tsx`

```tsx
'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type JSX } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import type { SiteContent } from '@/types/content';
import { PaginationRing } from './PaginationRing';
import styles from './TemplatesGallery.module.css';

export interface TemplatesGalleryProps {
  content: SiteContent['templates'];
}

/**
 * Portfolio showcase. Each item is a full-viewport slide with a full-bleed scene.
 * The circular "lens" and the item name look pinned to the screen, yet when two
 * slides meet, the lens shows the top half of one and the bottom half of the next.
 *
 * How: every slide has `clip-path: inset(0)` and contains a `position: fixed`
 * layer (lens + name). clip-path clips ALL descendants, fixed ones included, to
 * the slide's own box - so each fixed layer is only visible where its slide is,
 * and the boundary between slides becomes a moving wipe through the lens.
 * Zero JS per frame: the browser does it all during scroll.
 *
 * On top sits one sticky overlay (label, pagination ring, "view all") whose
 * active index comes from a center-line IntersectionObserver.
 */
export function TemplatesGallery({ content }: TemplatesGalleryProps): JSX.Element {
  const [active, setActive] = useState<number>(0);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const items = content.items;

  useEffect(() => {
    const slides = slideRefs.current.filter((n): n is HTMLElement => n !== null);

    // 1. Active index: whichever slide crosses the viewport's horizontal center line.
    const centerLine = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          if (!Number.isNaN(i)) setActive(i);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );

    // 2. Paint culling: a fixed layer is "on screen" even when fully clipped, so the
    //    browser would keep rasterizing all of them. Hide the layers of slides that
    //    are not intersecting at all. Written straight to the DOM - no re-render.
    const culling = new IntersectionObserver((entries) => {
      for (const e of entries) (e.target as HTMLElement).dataset.visible = String(e.isIntersecting);
    });

    slides.forEach((s) => {
      centerLine.observe(s);
      culling.observe(s);
    });
    return () => {
      centerLine.disconnect();
      culling.disconnect();
    };
  }, [items.length]);

  return (
    <section id="templates" className={styles.section} data-nav-tone="dark" aria-label={content.label}>
      <div className={styles.overlayTrack}>
        <div className={styles.overlay}>
          <p className={`${styles.label} t-micro`}>{content.label}</p>
          <div className={styles.ringBox}>
            <PaginationRing count={items.length} active={active} />
          </div>
          <GlassButton href={content.allHref} tone="dark" size="sm" className={styles.all}>
            View all work
          </GlassButton>
          <p className="sr-only" aria-live="polite">
            {`Showing ${active + 1} of ${items.length}: ${items[active]?.name ?? ''}`}
          </p>
        </div>
      </div>

      {items.map((item, i) => (
        <article
          key={item.id}
          className={styles.slide}
          data-index={i}
          ref={(node) => {
            slideRefs.current[i] = node;
          }}
          aria-label={`${item.name}, ${item.category}, ${item.price}`}
        >
          <Image src={item.background.src} alt="" fill sizes="100vw" quality={70} className={styles.scene} />

          <div className={styles.fixedLayer}>
            <a href={item.href} className={styles.lens} aria-label={`View ${item.name}`}>
              <Image src={item.lens.src} alt={item.lens.alt} fill sizes="(max-width: 809px) 64vw, 450px" className={styles.lensImg} />
            </a>
            <div className={styles.meta}>
              <h3 className={styles.name}>{item.name}</h3>
              <p className="t-micro">
                {item.category} / {item.price}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
```

### `src/components/sections/TemplatesGallery.module.css`

```css
.section {
  --lens: min(450px, 64vw);
  position: relative;
  background: var(--c-night);
  color: var(--c-paper);
}

/* ---- sticky overlay (one instance for all slides) ----
   An absolute track spanning the whole section holds a sticky 100vh child. The
   sticky child can never leave the track, so the overlay exits together with the
   last slide (a negative-margin sticky would overhang the next section by 100vh). */
.overlayTrack {
  position: absolute;
  inset: 0;
  z-index: var(--z-section-ui);
  pointer-events: none;
}
.overlay {
  position: sticky;
  top: 0;
  height: 100vh;
  display: grid;
  place-items: center;
}
.label { position: absolute; left: var(--gutter); top: 50%; translate: 0 -50%; }
.ringBox { width: calc(var(--lens) * 1.12); aspect-ratio: 1; }
.all { position: absolute; bottom: 28px; left: 50%; translate: -50% 0; pointer-events: auto; }

/* ---- slides ---- */
.slide {
  position: relative;
  height: 100vh;
  clip-path: inset(0);            /* the whole trick: clips the fixed layer below */
  overflow: clip;
}
.scene { object-fit: cover; }

.fixedLayer {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}
.slide[data-visible='false'] .fixedLayer { visibility: hidden; } /* paint culling */

.lens {
  position: relative;
  width: var(--lens);
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  pointer-events: auto;           /* clip-path also clips hit-testing, so only the visible slide's lens is clickable */
  box-shadow: 0 40px 120px rgba(0, 0, 0, 0.55);
}
.lensImg {
  object-fit: cover;
  transition: transform 0.15s cubic-bezier(0.12, 0.23, 0.5, 1); /* original: scale 1.05, 150 ms */
}
@media (hover: hover) { .lens:hover .lensImg { transform: scale(1.05); } }

.meta {
  position: absolute;
  right: var(--gutter);
  top: 50%;
  translate: 0 -50%;
  text-align: right;
}
.name {
  font-size: var(--t-h1-size);
  line-height: var(--t-h1-lh);
  letter-spacing: var(--t-h1-ls);
  font-weight: var(--fw-regular);
}
.meta p { margin-top: 6px; color: var(--c-paper-muted); }

@media (max-width: 809.98px) {
  .label { top: 88px; translate: 0 0; }
  .meta { top: auto; bottom: 96px; left: var(--gutter); right: var(--gutter); translate: 0 0; text-align: left; }
}
```

### `src/components/sections/PaginationRing.tsx`

```tsx
'use client';

import { motion } from 'motion/react';
import { useMemo, type JSX } from 'react';
import { SPRING_SMOOTH } from '@/lib/motion';
import styles from './PaginationRing.module.css';

export interface PaginationRingProps {
  count: number;
  active: number;
  /** Degrees of arc highlighted around the active index. */
  arc?: number;
  className?: string;
}

const SIZE = 500;
const C = SIZE / 2;
const R = 236;          // ring radius (viewBox units)
const LABEL_R = 256;    // numbers sit just outside the ring
const START = -60;      // angle of index 0, degrees clockwise from 12 o'clock

const polar = (deg: number, r: number): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};

/**
 * Circular pager around the template "lens". Thin full ring + one bright arc that
 * rotates (spring) to the active index; numbers fade between 35% and 100%.
 * One SVG, one animated `rotate` -> a single composited transform per change.
 */
export function PaginationRing({ count, active, arc = 56, className }: PaginationRingProps): JSX.Element {
  const step = 360 / count;
  const arcPath = useMemo<string>(() => {
    const a = polar(-arc / 2, R);
    const b = polar(arc / 2, R);
    return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
  }, [arc]);

  return (
    <svg className={[styles.ring, className].filter(Boolean).join(' ')} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <circle cx={C} cy={C} r={R} className={styles.track} />
      <motion.g
        style={{ originX: '50%', originY: '50%' }}
        initial={false}
        animate={{ rotate: START + active * step }}
        transition={SPRING_SMOOTH}
      >
        <path d={arcPath} className={styles.arc} />
      </motion.g>
      {Array.from({ length: count }, (_, i) => {
        const p = polar(START + i * step, LABEL_R);
        return (
          <text key={i} x={p.x} y={p.y} className={styles.num} data-active={i === active}>
            {i + 1}
          </text>
        );
      })}
    </svg>
  );
}
```

### `src/components/sections/PaginationRing.module.css`

```css
.ring { width: 100%; height: 100%; overflow: visible; }
.track { fill: none; stroke: rgba(255, 255, 255, 0.22); stroke-width: 1; vector-effect: non-scaling-stroke; }
.arc { fill: none; stroke: #fff; stroke-width: 1.5; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.num {
  fill: #fff;
  font-size: 12px;
  text-anchor: middle;
  dominant-baseline: middle;
  opacity: 0.35;
  transition: opacity var(--dur-base) var(--ease-out-soft);
}
.num[data-active='true'] { opacity: 1; }
```

### `src/components/sections/Faq.tsx`

```tsx
'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState, type JSX } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import { EASE_FILM } from '@/lib/motion';
import type { FaqItem, SiteContent } from '@/types/content';
import styles from './Faq.module.css';

export interface FaqProps {
  content: SiteContent['faq'];
  email: string;
}

interface AccordionItemProps {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}

function AccordionItem({ item, open, onToggle }: AccordionItemProps): JSX.Element {
  const uid = useId();
  const buttonId = `${uid}-q`;
  const panelId = `${uid}-a`;
  return (
    <div className={styles.item} data-open={open}>
      <h3>
        <button id={buttonId} type="button" className={styles.question} aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <span>{item.question}</span>
          <span className={styles.icon} aria-hidden="true" />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            className={styles.answerWrap}
            // height: 'auto' is measured once by Motion, then tweened in px.
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_FILM }}
          >
            <p className={`${styles.answer} t-small`}>{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Two-column FAQ. Items are independent (several can be open). The "+" rotates
 * 45 deg into an "x" in CSS; the panel animates height with Motion and the
 * closed panel is unmounted (no hidden text left in the tab order).
 */
export function Faq({ content, email }: FaqProps): JSX.Element {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set([content.items[0]?.id ?? '']));
  const toggle = (id: string): void =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const half = Math.ceil(content.items.length / 2);
  const columns: ReadonlyArray<readonly FaqItem[]> = [content.items.slice(0, half), content.items.slice(half)];

  return (
    <section className={styles.section} data-nav-tone="light" aria-labelledby="faq-title">
      <div className={styles.head}>
        <h2 id="faq-title" className={`${styles.title} t-h3`}>{content.title}</h2>
        <GlassButton tone="light" size="sm" href={`mailto:${email}`}>
          {content.askLabel}
        </GlassButton>
      </div>
      <div className={styles.grid}>
        {columns.map((col, c) => (
          <div key={c} className={styles.column}>
            {col.map((item) => (
              <AccordionItem key={item.id} item={item} open={openIds.has(item.id)} onToggle={() => toggle(item.id)} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
```

### `src/components/sections/Faq.module.css`

```css
.section { background: var(--c-canvas); color: var(--c-ink); padding: 160px var(--gutter) 200px; }
.head {
  max-width: 1120px;
  margin: 0 auto 48px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
}
.title { max-width: 12ch; font-weight: var(--fw-regular); }
.grid {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
.column { display: flex; flex-direction: column; gap: 12px; }
.item {
  background: var(--c-card);
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03), 0 8px 24px rgba(0, 0, 0, 0.03);
}
.item h3 { margin: 0; font: inherit; }
.question {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  text-align: left;
  font-size: var(--t-small-size);
  line-height: var(--t-small-lh);
  font-weight: var(--fw-medium);
}
.icon { position: relative; width: 12px; height: 12px; flex: none; transition: transform 0.4s var(--ease-in-out-film); }
.icon::before, .icon::after { content: ''; position: absolute; background: currentColor; border-radius: 1px; }
.icon::before { left: 0; right: 0; top: 50%; height: 1.5px; translate: 0 -50%; }
.icon::after { top: 0; bottom: 0; left: 50%; width: 1.5px; translate: -50% 0; }
.item[data-open='true'] .icon { transform: rotate(45deg); }
.answerWrap { overflow: hidden; }
.answer { padding: 0 20px 20px; color: var(--c-ink-muted); max-width: 52ch; }

@media (max-width: 809.98px) {
  .section { padding: 120px var(--gutter); }
  .head { flex-direction: column; align-items: flex-start; }
  .grid { grid-template-columns: 1fr; }
}
```

### `src/components/sections/CtaFooter.tsx`

```tsx
import type { JSX } from 'react';
import { BackToTop } from '@/components/ui/BackToTop';
import { GlassButton } from '@/components/ui/GlassButton';
import { LiveClock } from '@/components/ui/LiveClock';
import type { SiteContent } from '@/types/content';
import styles from './CtaFooter.module.css';

export interface CtaFooterProps {
  cta: SiteContent['cta'];
  footer: SiteContent['footer'];
  nav: SiteContent['nav'];
  brand: SiteContent['brand'];
}

/**
 * Curtain reveal: the CTA is `position: sticky` and stays put while the footer
 * slides up over it. The footer's top edge is a progressive blur: two
 * backdrop-filter layers (4 px, 10 px), each masked to a different band of a
 * gradient, then a solid fade to black. No JavaScript involved.
 * Server component; only the clock and back-to-top button hydrate.
 */
export function CtaFooter({ cta, footer, nav, brand }: CtaFooterProps): JSX.Element {
  return (
    <div className={styles.wrap}>
      <section className={styles.cta} data-nav-tone="light" aria-labelledby="cta-title">
        <h2 id="cta-title" className={`${styles.ctaTitle} t-h2`}>{cta.title}</h2>
        <GlassButton tone="light" size="md" href={cta.button.href}>
          {cta.button.label}
        </GlassButton>
      </section>

      <footer className={styles.footer} data-nav-tone="dark">
        <div className={styles.blurBand} aria-hidden="true">
          <span className={styles.blurSoft} />
          <span className={styles.blurStrong} />
          <span className={styles.solid} />
        </div>

        <div className={styles.body}>
          <div className={styles.top}>
            <ul className={`${styles.credits} t-micro`}>
              {footer.credits.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <nav className={styles.cols} aria-label="Footer">
              <div>
                <p className={`${styles.colTitle} t-micro`}>Index</p>
                <ul className="t-lead">
                  {nav.links.filter((l) => !l.disabled).map((l) => (
                    <li key={l.label}><a href={l.href}>{l.label}</a></li>
                  ))}
                  <li><a href={nav.cta.href}>Contact</a></li>
                </ul>
              </div>
              <div>
                <p className={`${styles.colTitle} t-micro`}>Socials</p>
                <ul className="t-lead">
                  {nav.socials.map((s) => (
                    <li key={s.label}><a href={s.href} target="_blank" rel="noreferrer noopener">{s.label}</a></li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <hr className={styles.rule} />

          {/* Wordmark: SVG textLength stretches the spacing so it always spans the full width, at any font. */}
          <svg className={styles.wordmark} viewBox="0 0 1200 200" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
            <text x="0" y="168" textLength="1200" lengthAdjust="spacing">{brand.wordmark}</text>
          </svg>

          <div className={styles.bottom}>
            <LiveClock timeZone={brand.timeZone} className="t-micro" offsetClassName={styles.muted} />
            <BackToTop />
          </div>
        </div>
      </footer>
    </div>
  );
}
```

### `src/components/sections/CtaFooter.module.css`

```css
.wrap { position: relative; background: var(--c-canvas); }

.cta {
  position: sticky;
  top: 0;
  z-index: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  color: var(--c-ink);
  text-align: center;
  padding: 0 var(--gutter);
}
.ctaTitle { font-weight: var(--fw-regular); }

.footer { position: relative; z-index: 1; color: var(--c-paper); }

/* ---- progressive blur band ---- */
.blurBand { position: relative; height: 45vh; margin-bottom: -1px; }
.blurBand > span { position: absolute; inset: 0; }
.blurSoft {
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 35%);
  mask-image: linear-gradient(to bottom, transparent 0%, #000 35%);
}
.blurStrong {
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  -webkit-mask-image: linear-gradient(to bottom, transparent 30%, #000 75%);
  mask-image: linear-gradient(to bottom, transparent 30%, #000 75%);
}
.solid { background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 45%, #000 100%); }

/* ---- footer body ---- */
.body { background: var(--c-night); padding: 0 var(--gutter) 24px; }
.top { display: flex; justify-content: space-between; gap: 40px; padding-top: 8px; }
.credits { color: var(--c-paper); display: flex; flex-direction: column; gap: 2px; }
.cols { display: grid; grid-template-columns: repeat(2, minmax(160px, 1fr)); gap: 40px; width: min(440px, 50%); }
.colTitle { margin-bottom: 12px; color: var(--c-paper); }
.cols ul { display: flex; flex-direction: column; gap: 2px; }
.cols a { transition: opacity var(--dur-fast) var(--ease-out-soft); }
@media (hover: hover) { .cols a:hover { opacity: 0.6; } }
.rule { border: 0; border-top: 1px solid var(--c-hairline-dark); margin: 40px 0 16px; }

.wordmark { display: block; width: 100%; height: auto; overflow: visible; }
.wordmark text {
  fill: #e6e6e6;
  font-family: var(--font-sans);
  font-size: 212px;
  font-weight: var(--fw-regular);
  letter-spacing: -0.04em;
}
.bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
.muted { color: var(--c-paper-muted); }

@media (max-width: 809.98px) {
  .top { flex-direction: column; }
  .cols { width: 100%; }
}
```

### `src/app/layout.tsx`

```tsx
import type { Metadata, Viewport } from 'next';
import type { JSX, ReactNode } from 'react';
// Self-hosted variable font via Fontsource (no next/font, no runtime Google request).
import '@fontsource-variable/inter-tight';
import './globals.css';

export const metadata: Metadata = {
  title: 'Your Studio - Motion-first websites',
  description: 'A faithful rebuild of a motion-rich studio site: loader, video morph, sticky services, scroll-reveal testimonials and a clip-path portfolio lens.',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### `src/app/page.tsx`

```tsx
import type { JSX } from 'react';
import { site } from '@/content/site';
import { VideoMorphProvider } from '@/components/morph/VideoMorph';
import { IntroProvider } from '@/components/providers/IntroProvider';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { About } from '@/components/sections/About';
import { CtaFooter } from '@/components/sections/CtaFooter';
import { Faq } from '@/components/sections/Faq';
import { Hero } from '@/components/sections/Hero';
import { Loader } from '@/components/sections/Loader';
import { Nav } from '@/components/sections/Nav';
import { Playreel } from '@/components/sections/Playreel';
import { Services } from '@/components/sections/Services';
import { TemplatesGallery } from '@/components/sections/TemplatesGallery';
import { Testimonials } from '@/components/sections/Testimonials';

/**
 * Page composition. This file is a Server Component: it only wires content into
 * sections. Providers are client components that wrap the tree:
 *   SmoothScroll (Lenis) > Intro (shared loader clock) > VideoMorph (hero -> reel)
 */
export default function HomePage(): JSX.Element {
  return (
    <SmoothScrollProvider>
      <IntroProvider>
        <VideoMorphProvider>
          <Loader images={site.intro.images} brand={site.brand.name} />
          <Nav brand={site.brand.name} links={site.nav.links} socials={site.nav.socials} cta={site.nav.cta} />
          <main>
            <Hero content={site.hero} timeZone={site.brand.timeZone} />
            <Playreel content={site.playreel} />
            <About content={site.about} />
            <Services content={site.services} contactHref={site.nav.cta.href} />
            <Testimonials items={site.testimonials} />
            <TemplatesGallery content={site.templates} />
            <Faq content={site.faq} email={site.brand.email} />
          </main>
          <CtaFooter cta={site.cta} footer={site.footer} nav={site.nav} brand={site.brand} />
        </VideoMorphProvider>
      </IntroProvider>
    </SmoothScrollProvider>
  );
}
```
