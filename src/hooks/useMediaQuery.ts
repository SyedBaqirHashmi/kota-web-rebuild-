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
