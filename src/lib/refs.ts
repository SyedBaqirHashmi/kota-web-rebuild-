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
