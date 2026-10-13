'use client';

import Image from 'next/image';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import { useEffect, type JSX } from 'react';
import { useIntro } from '@/components/providers/IntroProvider';
import { useLenis } from '@/components/providers/SmoothScrollProvider';
import { EASE_FILM, INTRO, SPRING_SMOOTH } from '@/lib/motion';
import type { ImageAsset } from '@/types/content';
import styles from './Loader.module.css';

export interface LoaderProps {
  images: readonly ImageAsset[];
  brand: string;
}

/**
 * Intro sequence (0 -> ~4.5 s):
 *  0.50-1.50 s  eight project shots spring up from 1000 px below, alternating
 *               right/left offsets that shrink toward center, and stack.
 *  0 -> exit    percentage counter runs.
 *  3.25 s       hard-edged wipe from the bottom up reveals the hero underneath.
 *  ~4.5 s       loader unmounts (images + nodes released), scroll unlocks.
 */
export function Loader({ images, brand }: LoaderProps): JSX.Element | null {
  const { done, markDone, exitAt } = useIntro();
  const lenis = useLenis();
  const reduce = useReducedMotion() ?? false;

  // Counter lives in a MotionValue and is rendered as a motion child:
  // ~200 text updates with zero React re-renders.
  const progress = useMotionValue<number>(0);
  const label = useTransform(progress, (v: number) => `${Math.round(v)}%`);

  // Scroll lock while the loader is up. Lenis is created after mount, so this
  // effect re-runs when it appears and stops it immediately.
  useEffect(() => {
    if (done) return;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    lenis?.stop();
    return () => {
      root.style.overflow = '';
      lenis?.start();
    };
  }, [done, lenis]);

  useEffect(() => {
    if (done) return;
    const controls = animate(progress, 100, { duration: Math.max(0.2, exitAt - 0.2), ease: [0.65, 0, 0.35, 1] });
    return () => controls.stop();
  }, [done, exitAt, progress]);

  if (done) return null; // unmount = every image, node and animation released

  return (
    <motion.div
      className={styles.root}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${brand}`}
      initial={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      // Same hard-edged bottom-up wipe as the original's animated mask-image gradient,
      // but clip-path is on Motion's hardware-accelerated list (runs via WAAPI) and
      // needs no offscreen mask texture.
      transition={{ delay: exitAt, duration: reduce ? 0.3 : INTRO.wipeDuration, ease: EASE_FILM }}
      onAnimationComplete={markDone}
    >
      <div className={styles.meta}>
        <span>0%</span>
        <span>{brand}</span>
        <motion.span className={styles.counter}>{label}</motion.span>
      </div>

      <div className={styles.stage} aria-hidden="true">
        {images.map((img, i) => (
          <motion.div
            key={img.src}
            className={styles.card}
            style={{ zIndex: i + 1 }}
            // transformTemplate keeps the -50%/-50% centering in the same transform
            // string as the animated x/y, exactly like Framer's
            // "translate(-50%, -50%) __Appear_Animation_Transform__".
            transformTemplate={(_, generated) => `translate(-50%, -50%) ${generated}`}
            initial={reduce ? false : { x: INTRO.cardOffsetsX[i] ?? 0, y: INTRO.cardOffsetY }}
            animate={{ x: 0, y: 0 }}
            transition={{ ...SPRING_SMOOTH, delay: INTRO.cardDelays[i] ?? 1.5 }}
          >
            <Image src={img.src} alt="" fill sizes="(max-width: 809px) 70vw, 600px" priority={i < 4} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
