'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useCallback, useRef, useState, type JSX } from 'react';
import { LazyVideo } from '@/components/media/LazyVideo';
import { useVideoMorphRefs } from '@/components/morph/VideoMorph';
import type { SiteContent } from '@/types/content';
import { ReelModal } from './ReelModal';
import styles from './Playreel.module.css';

export interface PlayreelProps {
  content: SiteContent['playreel'];
}

/**
 * "PLAY [>] REEL". While the section scrolls from the bottom of the viewport to
 * the top: PLAY slides in from x -300, REEL from x +300, and the button grows
 * 0.5 -> 1 (the original's three onScrollTarget transforms). At the same time the
 * hero clip morphs into this section's backdrop (see VideoMorph).
 */
export function Playreel({ content }: PlayreelProps): JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { targetRef, enabled: morphing } = useVideoMorphRefs();
  const [open, setOpen] = useState<boolean>(false);
  const handleClose = useCallback((): void => setOpen(false), []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'start start'] });
  const playX = useTransform(scrollYProgress, [0, 1], [-300, 0]);
  const reelX = useTransform(scrollYProgress, [0, 1], [300, 0]);
  const buttonScale = useTransform(scrollYProgress, [0, 1], [0.5, 1]);

  return (
    <section ref={sectionRef} className={styles.section} data-nav-tone="dark" aria-label="Showreel">
      {/* Morph target. When the morph is off (phones, reduced motion) it shows its own clip. */}
      <div ref={targetRef} className={styles.backdrop}>
        {!morphing && <LazyVideo video={content.video} className={styles.backdropVideo} />}
        <div className={styles.fade} aria-hidden="true" />
      </div>

      <div className={styles.inner}>
        <div className={styles.cluster}>
          <span className={`${styles.duration} t-micro`}>{content.duration}</span>
          <motion.span className={styles.word} style={{ x: playX }}>PLAY</motion.span>
          <motion.button
            type="button"
            className={styles.play}
            style={{ scale: buttonScale }}
            onClick={() => setOpen(true)}
            aria-label="Play showreel"
            aria-haspopup="dialog"
          >
            <svg viewBox="0 0 12 14" width="12" height="14" aria-hidden="true">
              <path d="M0 0 12 7 0 14Z" fill="currentColor" />
            </svg>
          </motion.button>
          <motion.span className={styles.word} style={{ x: reelX }}>REEL</motion.span>
          <span className={`${styles.year} t-micro`}>{content.year}</span>
        </div>
      </div>

      <ReelModal open={open} onClose={handleClose} video={content.video} title="Showreel" />
    </section>
  );
}
