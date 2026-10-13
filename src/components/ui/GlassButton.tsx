import type { AnchorHTMLAttributes, ButtonHTMLAttributes, JSX, ReactNode, Ref } from 'react';
import styles from './GlassButton.module.css';

export type GlassTone = 'dark' | 'light';
export type GlassSize = 'sm' | 'md' | 'icon';

interface GlassBaseProps {
  tone?: GlassTone;
  size?: GlassSize;
  children: ReactNode;
  className?: string;
}

export type GlassAnchorProps = GlassBaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof GlassBaseProps | 'href'> & {
    href: string;
    ref?: Ref<HTMLAnchorElement>;
  };

export type GlassNativeButtonProps = GlassBaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof GlassBaseProps> & {
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
  };

export type GlassButtonProps = GlassAnchorProps | GlassNativeButtonProps;

/** Four stacked layers, named after the original Framer layers. All decorative. */
function Layers(): JSX.Element {
  return (
    <>
      <span className={styles.fill} aria-hidden="true" />
      <span className={styles.fog} aria-hidden="true" />
      <span className={styles.inner} aria-hidden="true" />
      <span className={styles.highlights} aria-hidden="true" />
    </>
  );
}

/**
 * "Liquid glass" pill. Pure CSS: backdrop blur + six inset shadows for the rim light,
 * so hover/press only animate `opacity` and `transform` (compositor-only, no repaint
 * of the blur region on every frame).
 * Renders an <a> when `href` is given, otherwise a <button>. Server-component safe.
 */
export function GlassButton(props: GlassButtonProps): JSX.Element {
  const tone: GlassTone = props.tone ?? 'dark';
  const size: GlassSize = props.size ?? 'md';
  const cls = [styles.root, styles[tone], styles[size], props.className].filter(Boolean).join(' ');

  if (props.href !== undefined) {
    const { tone: _t, size: _s, className: _c, children, ref, ...anchorRest } = props;
    return (
      <a ref={ref} className={cls} {...anchorRest}>
        <Layers />
        <span className={styles.label}>{children}</span>
      </a>
    );
  }

  const { tone: _t, size: _s, className: _c, children, ref, type, ...buttonRest } = props;
  return (
    <button ref={ref} type={type ?? 'button'} className={cls} {...buttonRest}>
      <Layers />
      <span className={styles.label}>{children}</span>
    </button>
  );
}
