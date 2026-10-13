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
