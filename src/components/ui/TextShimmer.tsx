import type { CSSProperties, JSX } from 'react';
import styles from './TextShimmer.module.css';

export interface TextShimmerProps {
  text: string;
  /** 1-10. Cycle length = 11 - speed seconds (same mapping as the original component). */
  speed?: number;
  /** 1-100. Width of the bright band as a share of the gradient. */
  size?: number;
  /** Gradient angle in degrees. */
  rotation?: number;
  direction?: 'left' | 'right';
  baseColor?: string;
  shimmerColor?: string;
  as?: 'p' | 'span';
  className?: string;
}

type ShimmerVars = CSSProperties & Record<`--${string}`, string>;

/**
 * Light sweep across text ("Available for new projects").
 *
 * Optimization vs. the original: the Framer component injects a fresh <style> tag
 * with its own @keyframes per instance. Here every instance shares ONE keyframe
 * and is parameterized through CSS custom properties, so N shimmers cost one rule.
 * The animation only moves `background-position` on a clipped text layer.
 */
export function TextShimmer({
  text,
  speed = 8,
  size = 65,
  rotation = 120,
  direction = 'right',
  baseColor = 'rgb(109, 109, 109)',
  shimmerColor = 'rgb(255, 255, 255)',
  as: Tag = 'p',
  className,
}: TextShimmerProps): JSX.Element {
  const band = (size * 30) / 100;
  const vars: ShimmerVars = {
    '--shimmer-duration': `${11 - speed}s`,
    '--shimmer-angle': `${rotation}deg`,
    '--shimmer-from': `${50 - band}%`,
    '--shimmer-to': `${50 + band}%`,
    '--shimmer-color': shimmerColor,
    '--shimmer-start': direction === 'left' ? '-100%' : '200%',
    '--shimmer-end': direction === 'left' ? '200%' : '-100%',
    color: baseColor,
  };

  return (
    <span className={[styles.root, className].filter(Boolean).join(' ')} style={vars}>
      <Tag className={styles.base}>{text}</Tag>
      <Tag className={styles.sweep} aria-hidden="true">
        {text}
      </Tag>
    </span>
  );
}
