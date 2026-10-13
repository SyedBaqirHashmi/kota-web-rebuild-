# kota-rebuild

A TypeScript rebuild of the interaction system behind madebykota.com, using Next.js 15, Motion and Lenis.
The full teardown is in [TEARDOWN.md](./TEARDOWN.md). It covers every effect, the architecture, the disposal model and the complete source.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run typecheck    # strict TS, no emit
npm run build && npm start
```

Placeholder media is already in `public/media`. To regenerate it, run `python3 scripts/generate-placeholders.py` (needs Pillow and ffmpeg).

## Make it yours

| What | Where |
| --- | --- |
| Copy, links, services, testimonials, work items | `src/content/site.ts` (typed by `src/types/content.ts`) |
| Colors, type scale, glass shadows, z-layers | `src/styles/tokens.css` |
| Springs, eases, intro timeline, menu stagger | `src/lib/motion.ts` |
| Font | `--font-sans` in tokens + the Fontsource import in `src/app/layout.tsx` |
| Media | `public/media/**` (each video needs webm + mp4 + poster) |

## Notes

- The project doesn't use `next/font`. Fonts are self-hosted through Fontsource.
- Source files contain ASCII only. Typographic characters are written as `\u` escapes.
- The original site uses TWK Lausanne, a commercial font. Inter Tight stands in for it here.
- None of Kota Studio's copy, imagery or video is included. All content is placeholder.
