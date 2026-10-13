'use client';

import { useRef, type JSX } from 'react';
import { ScrollRevealText } from '@/components/ui/ScrollRevealText';
import type { Testimonial } from '@/types/content';
import styles from './Testimonials.module.css';

export interface TestimonialsProps {
  items: readonly Testimonial[];
}

interface TestimonialRowProps {
  item: Testimonial;
}

/**
 * One tall (150vh) row. Label, quote and author live in ONE sticky container so
 * they pin and release together. Because that container stops moving while stuck,
 * the reveal is driven by the row (trackRef), which keeps scrolling underneath.
 */
function TestimonialRow({ item }: TestimonialRowProps): JSX.Element {
  const rowRef = useRef<HTMLElement | null>(null);
  return (
    <figure ref={rowRef} className={styles.row}>
      <div className={styles.stick}>
        <p className={`${styles.label} t-micro`}>Testimonial</p>
        <blockquote className={styles.quote}>
          <ScrollRevealText
            text={item.quote}
            trackRef={rowRef}
            sticky={false}
            start={0.7}
            revealDistance={800}
            initialOpacity={0.2}
            className="t-h4"
          />
        </blockquote>
        <figcaption className={`${styles.author} t-micro`}>{item.author}</figcaption>
      </div>
    </figure>
  );
}

/** Testimonials: each quote lights up word by word (dim words at 20% opacity) over ~800 px of scroll. */
export function Testimonials({ items }: TestimonialsProps): JSX.Element {
  return (
    <section className={styles.section} data-nav-tone="light" aria-label="Testimonials">
      {items.map((t, i) => (
        <TestimonialRow key={i} item={t} />
      ))}
    </section>
  );
}
