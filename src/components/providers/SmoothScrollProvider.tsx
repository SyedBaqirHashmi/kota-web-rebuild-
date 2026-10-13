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
