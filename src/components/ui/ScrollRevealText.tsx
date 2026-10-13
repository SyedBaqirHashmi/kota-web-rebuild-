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
