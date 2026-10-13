'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useState, type JSX } from 'react';
import { CountUp } from '@/components/ui/CountUp';
import { GlassButton } from '@/components/ui/GlassButton';
import { EASE_OUT_SOFT, SPRING_SMOOTH } from '@/lib/motion';
import type { SiteContent } from '@/types/content';
import styles from './About.module.css';

export interface AboutProps {
  content: SiteContent['about'];
}

/**
 * Light "About" block: statement fades up once in view, then a facts slider
 * (prev/next glass arrows) whose big number counts up on view and on every change.
 */
export function About({ content }: AboutProps): JSX.Element {
  const [index, setIndex] = useState<number>(0);
  const total = content.facts.length;
  const fact = content.facts[index];
  const step = (dir: 1 | -1): void => setIndex((i) => (i + dir + total) % total);

  return (
    <section className={styles.section} data-nav-tone="light" aria-labelledby="about-label">
      <div className={styles.statementRow}>
        <p id="about-label" className={`${styles.label} t-micro`}>{content.label}</p>
        <motion.p
          className={`${styles.statement} t-h4`}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={SPRING_SMOOTH}
        >
          {content.statement}
        </motion.p>
      </div>

      <div className={styles.facts}>
        <div className={styles.arrows}>
          <GlassButton tone="light" size="icon" aria-label="Previous fact" onClick={() => step(-1)}>
            <span aria-hidden="true">{'\u2190'}</span>
          </GlassButton>
          <GlassButton tone="light" size="icon" aria-label="Next fact" onClick={() => step(1)}>
            <span aria-hidden="true">{'\u2192'}</span>
          </GlassButton>
        </div>

        <div className={styles.factViewport} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {fact && (
              <motion.div
                key={fact.label}
                className={styles.fact}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: EASE_OUT_SOFT }}
              >
                <p className={`${styles.factLabel} t-micro`}>{fact.label}</p>
                <CountUp value={fact.value} suffix={fact.suffix} className={styles.number} />
                <p className={`${styles.factText} t-small`}>{fact.description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className={`${styles.counter} t-micro`} aria-hidden="true">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </p>
      </div>
    </section>
  );
}
