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
