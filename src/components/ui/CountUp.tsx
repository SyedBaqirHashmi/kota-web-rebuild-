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
