'use client';

import { motion } from 'motion/react';
import { useMemo, type JSX } from 'react';
import { SPRING_SMOOTH } from '@/lib/motion';
import styles from './PaginationRing.module.css';

export interface PaginationRingProps {
  count: number;
  active: number;
  /** Degrees of arc highlighted around the active index. */
  arc?: number;
  className?: string;
}

const SIZE = 500;
const C = SIZE / 2;
const R = 236;          // ring radius (viewBox units)
const LABEL_R = 256;    // numbers sit just outside the ring
const START = -60;      // angle of index 0, degrees clockwise from 12 o'clock

const polar = (deg: number, r: number): { x: number; y: number } => {
  const rad = (deg * Math.PI) / 180;
  return { x: C + r * Math.sin(rad), y: C - r * Math.cos(rad) };
};

/**
 * Circular pager around the template "lens". Thin full ring + one bright arc that
 * rotates (spring) to the active index; numbers fade between 35% and 100%.
 * One SVG, one animated `rotate` -> a single composited transform per change.
 */
export function PaginationRing({ count, active, arc = 56, className }: PaginationRingProps): JSX.Element {
  const step = 360 / count;
  const arcPath = useMemo<string>(() => {
    const a = polar(-arc / 2, R);
    const b = polar(arc / 2, R);
    return `M ${a.x} ${a.y} A ${R} ${R} 0 0 1 ${b.x} ${b.y}`;
  }, [arc]);

  return (
    <svg className={[styles.ring, className].filter(Boolean).join(' ')} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
      <circle cx={C} cy={C} r={R} className={styles.track} />
      <motion.g
        style={{ originX: '50%', originY: '50%' }}
        initial={false}
        animate={{ rotate: START + active * step }}
        transition={SPRING_SMOOTH}
      >
        <path d={arcPath} className={styles.arc} />
      </motion.g>
      {Array.from({ length: count }, (_, i) => {
        const p = polar(START + i * step, LABEL_R);
        return (
          <text key={i} x={p.x} y={p.y} className={styles.num} data-active={i === active}>
            {i + 1}
          </text>
        );
      })}
    </svg>
  );
}
