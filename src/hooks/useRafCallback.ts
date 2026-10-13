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
