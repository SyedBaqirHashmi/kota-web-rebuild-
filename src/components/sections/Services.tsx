'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type CSSProperties, type JSX } from 'react';
import { LazyVideo } from '@/components/media/LazyVideo';
import { GlassButton } from '@/components/ui/GlassButton';
import { EASE_OUT_SOFT } from '@/lib/motion';
import type { Service, SiteContent } from '@/types/content';
import styles from './Services.module.css';

export interface ServicesProps {
  content: SiteContent['services'];
  contactHref: string;
}

interface ServiceInfoProps {
  service: Service;
  label: string;
  contactHref: string;
}

function ServiceInfo({ service, label, contactHref }: ServiceInfoProps): JSX.Element {
  return (
    <div className={styles.info}>
      <div>
        <p className={`${styles.kicker} t-micro`}>{label}</p>
        <h3 className={`${styles.name} t-h2`}>{service.name}</h3>
      </div>
      <div className={styles.specs}>
        <dl className={styles.specCol}>
          <div>
            <dt className="t-micro">Timeline</dt>
            <dd className="t-micro">{service.timeline}</dd>
          </div>
          <div>
            <dt className="t-micro">Deliverables</dt>
            <dd className="t-micro">{service.deliverables}</dd>
          </div>
        </dl>
        <p className={`${styles.description} t-micro`}>{service.description}</p>
      </div>
      <div className={styles.priceRow}>
        <div>
          <p className={`${styles.kicker} t-micro`}>Starting from</p>
          <p className={`${styles.price} t-h3`}>{service.priceFrom}</p>
        </div>
        <GlassButton tone="light" size="sm" href={contactHref}>
          Start a project
        </GlassButton>
      </div>
    </div>
  );
}

/**
 * Sticky services showcase (desktop/tablet):
 *  - the section is N x 100vh tall; a 100vh stage sticks while you scroll through it
 *  - N invisible 100vh "trigger" blocks sit behind the stage; whichever one crosses
 *    the viewport's center line becomes active (the original uses Framer
 *    "variant appear" targets with threshold 0.5 - same idea)
 *  - left: service details crossfade; right: stacked clips, only the active one plays
 * Phones get a plain stacked list instead (rendered in parallel, hidden by CSS).
 */
export function Services({ content, contactHref }: ServicesProps): JSX.Element {
  const [active, setActive] = useState<number>(0);
  const triggerRefs = useRef<Array<HTMLDivElement | null>>([]);
  const items = content.items;
  const current = items[active] ?? items[0];

  useEffect(() => {
    const nodes = triggerRefs.current.filter((n): n is HTMLDivElement => n !== null);
    // A zero-height band at 50% of the viewport: exactly one trigger intersects it at a time.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.index);
          if (!Number.isNaN(i)) setActive(i);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [items.length]);

  const trackStyle: CSSProperties & Record<'--count', number> = { '--count': items.length };

  return (
    <section className={styles.section} data-nav-tone="light" aria-label={content.label}>
      {/* ---------- desktop / tablet: sticky stage ---------- */}
      <div className={`${styles.track} only-desktop`} style={trackStyle}>
        <div className={styles.stage}>
          <div className={styles.infoCol}>
            <AnimatePresence mode="wait" initial={false}>
              {current && (
                <motion.div
                  key={current.id}
                  className={styles.infoMotion}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3, ease: EASE_OUT_SOFT }}
                >
                  <ServiceInfo service={current} label={content.label} contactHref={contactHref} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className={styles.videoCol}>
            <div className={styles.frame}>
              {items.map((s, i) => (
                <LazyVideo
                  key={s.id}
                  video={s.video}
                  active={i === active}
                  className={styles.clip}
                  data-active={i === active}
                  aria-hidden="true"
                />
              ))}
              <div className={styles.frameShade} aria-hidden="true" />
              <ol className={`${styles.index} t-micro`}>
                {items.map((s, i) => (
                  <li key={s.id} data-active={i === active}>
                    {s.name}
                    <span className={styles.dash} aria-hidden="true">{' \u2014'}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className={styles.triggers} aria-hidden="true">
          {items.map((s, i) => (
            <div
              key={s.id}
              data-index={i}
              className={styles.trigger}
              ref={(node) => {
                triggerRefs.current[i] = node;
              }}
            />
          ))}
        </div>
      </div>

      {/* ---------- phone: stacked cards ---------- */}
      <div className={`${styles.stack} only-phone`}>
        {items.map((s) => (
          <article key={s.id} className={styles.card}>
            <LazyVideo video={s.video} className={styles.cardClip} aria-hidden="true" />
            <ServiceInfo service={s} label={content.label} contactHref={contactHref} />
          </article>
        ))}
      </div>
    </section>
  );
}
