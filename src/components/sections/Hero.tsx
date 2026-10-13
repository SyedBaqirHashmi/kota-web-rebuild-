'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react';
import { useRef, type JSX } from 'react';
import { LazyVideo } from '@/components/media/LazyVideo';
import { useVideoMorphRefs } from '@/components/morph/VideoMorph';
import { useIntro } from '@/components/providers/IntroProvider';
import { LiveClock } from '@/components/ui/LiveClock';
import { TextShimmer } from '@/components/ui/TextShimmer';
import { SPRING_SMOOTH } from '@/lib/motion';
import type { HeroRow, HeroSegment, SiteContent } from '@/types/content';
import styles from './Hero.module.css';

export interface HeroProps {
  content: SiteContent['hero'];
  timeZone: string;
}

interface SegmentProps {
  segment: HeroSegment;
  fade: MotionValue<number>;
  video: SiteContent['hero']['video'];
}

/**
 * IMPORTANT for the morph: the scroll fade is applied to each TEXT segment, never
 * to a wrapper around the video slot. An ancestor with opacity < 1 would fade the
 * fixed-position clip too (fixed elements still paint inside their ancestors'
 * stacking contexts), and an ancestor transform would re-anchor `position: fixed`.
 */
function Segment({ segment, fade, video }: SegmentProps): JSX.Element {
  const { sourceRef } = useVideoMorphRefs();
  switch (segment.kind) {
    case 'text':
      return <motion.span className={styles.word} style={{ opacity: fade }}>{segment.text}</motion.span>;
    case 'gap':
      return <span className={styles.gap} />;
    case 'icon':
      return (
        <motion.span className={styles.icon} style={{ opacity: fade }}>
          {/* decorative inline glyph: plain img, no layout shift (explicit size) */}
          <img src={segment.src} alt={segment.alt} width={64} height={64} />
        </motion.span>
      );
    case 'video':
      return (
        <span className={styles.videoSlot}>
          <LazyVideo ref={sourceRef} video={video} className={styles.video} preloadMargin="0px" />
        </span>
      );
  }
}

/**
 * Hero: dark, full viewport. Layers (back to front):
 *  1. blurred "wall of work" image with parallax (moves at 25% of scroll) + fade-out
 *  2. right-aligned three-row headline with an inline clip and an inline icon
 *  3. bottom bar: studio clock / tagline / "Scroll for more" cue
 * Entrance waits for the loader (heroDelay); scroll-out fades every text layer.
 */
export function Hero({ content, timeZone }: HeroProps): JSX.Element {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { heroDelay, chromeDelay } = useIntro();

  // Motion's useScroll uses a native ScrollTimeline where supported, so these
  // opacity/transform mappings can run off the main thread.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const fade = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  return (
    <section ref={sectionRef} className={styles.hero} data-nav-tone="dark" aria-labelledby="hero-title">
      <motion.div className={styles.bg} style={{ y: bgY, opacity: bgOpacity }} aria-hidden="true">
        <Image
          src={content.background.src}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={70}
          className={styles.bgImage}
        />
      </motion.div>

      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: heroDelay }}
      >
        <motion.p className={styles.badge} style={{ opacity: fade }}>
          <img src="/media/spark.svg" alt="" width={12} height={12} />
          {content.badge}
        </motion.p>

        <h1 id="hero-title" className="sr-only">{content.seoTitle}</h1>
        <div className={styles.title} aria-hidden="true">
          {content.rows.map((row: HeroRow, r) => (
            <div key={r} className={styles.row}>
              {row.map((segment, s) => (
                <Segment key={`${r}-${s}`} segment={segment} fade={fade} video={content.video} />
              ))}
            </div>
          ))}
        </div>

        <motion.div className={styles.availability} style={{ opacity: fade }}>
          <TextShimmer text={content.availability} as="span" />
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.bottom}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING_SMOOTH, delay: chromeDelay }}
      >
        <motion.div className={`${styles.clock} only-desktop`} style={{ opacity: fade }}>
          <LiveClock timeZone={timeZone} className="t-micro" offsetClassName={styles.muted} />
        </motion.div>
        <motion.p className={`${styles.tagline} t-small`} style={{ opacity: fade }}>
          {content.tagline.strong} <span className={styles.muted}>{content.tagline.rest}</span>
        </motion.p>
        <motion.div className={styles.scrollCue} style={{ opacity: fade }} aria-hidden="true">
          <span className={styles.scrollLabel}>
            Scroll <span className={styles.muted}>for more</span>
          </span>
          <span className={styles.scrollTrack}>
            <span className={styles.scrollLine} />
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
