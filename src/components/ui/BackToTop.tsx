'use client';

import type { JSX } from 'react';
import { useLenis } from '@/components/providers/SmoothScrollProvider';
import { GlassButton } from './GlassButton';

export interface BackToTopProps {
  className?: string;
}

/** Uses Lenis when present (same easing as wheel scrolling), native smooth scroll otherwise. */
export function BackToTop({ className }: BackToTopProps): JSX.Element {
  const lenis = useLenis();
  return (
    <GlassButton
      tone="dark"
      size="icon"
      className={className}
      aria-label="Back to top"
      onClick={() => {
        if (lenis) lenis.scrollTo(0, { duration: 2 });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    >
      <span aria-hidden="true">{'\u2191'}</span>
    </GlassButton>
  );
}
