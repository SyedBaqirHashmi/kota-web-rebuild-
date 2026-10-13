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
