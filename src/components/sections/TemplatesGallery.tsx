'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type JSX } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import type { SiteContent } from '@/types/content';
import { PaginationRing } from './PaginationRing';
import styles from './TemplatesGallery.module.css';

export interface TemplatesGalleryProps {
  content: SiteContent['templates'];
}

/**
 * Portfolio showcase. Each item is a full-viewport slide with a full-bleed scene.
 * The circular "lens" and the item name look pinned to the screen, yet when two
 * slides meet, the lens shows the top half of one and the bottom half of the next.
 *
 * How: every slide has `clip-path: inset(0)` and contains a `position: fixed`
 * layer (lens + name). clip-path clips ALL descendants, fixed ones included, to
 * the slide's own box - so each fixed layer is only visible where its slide is,
 * and the boundary between slides becomes a moving wipe through the lens.
 * Zero JS per frame: the browser does it all during scroll.
 *
 * On top sits one sticky overlay (label, pagination ring, "view all") whose
 * active index comes from a center-line IntersectionObserver.
 */
export function TemplatesGallery({ content }: TemplatesGalleryProps): JSX.Element {
  const [active, setActive] = useState<number>(0);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const items = content.items;

  useEffect(() => {
    const slides = slideRefs.current.filter((n): n is HTMLElement => n !== null);

    // 1. Active index: whichever slide crosses the viewport's horizontal center line.
    const centerLine = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const i = Number((e.target as HTMLElement).dataset.index);
          if (!Number.isNaN(i)) setActive(i);
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );

    // 2. Paint culling: a fixed layer is "on screen" even when fully clipped, so the
    //    browser would keep rasterizing all of them. Hide the layers of slides that
    //    are not intersecting at all. Written straight to the DOM - no re-render.
    const culling = new IntersectionObserver((entries) => {
      for (const e of entries) (e.target as HTMLElement).dataset.visible = String(e.isIntersecting);
    });

    slides.forEach((s) => {
      centerLine.observe(s);
      culling.observe(s);
    });
    return () => {
      centerLine.disconnect();
      culling.disconnect();
    };
  }, [items.length]);

  return (
    <section id="templates" className={styles.section} data-nav-tone="dark" aria-label={content.label}>
      <div className={styles.overlayTrack}>
        <div className={styles.overlay}>
          <p className={`${styles.label} t-micro`}>{content.label}</p>
          <div className={styles.ringBox}>
            <PaginationRing count={items.length} active={active} />
          </div>
          <GlassButton href={content.allHref} tone="dark" size="sm" className={styles.all}>
            View all work
          </GlassButton>
          <p className="sr-only" aria-live="polite">
            {`Showing ${active + 1} of ${items.length}: ${items[active]?.name ?? ''}`}
          </p>
        </div>
      </div>

      {items.map((item, i) => (
        <article
          key={item.id}
          className={styles.slide}
          data-index={i}
          ref={(node) => {
            slideRefs.current[i] = node;
          }}
          aria-label={`${item.name}, ${item.category}, ${item.price}`}
        >
          <Image src={item.background.src} alt="" fill sizes="100vw" quality={70} className={styles.scene} />

          <div className={styles.fixedLayer}>
            <a href={item.href} className={styles.lens} aria-label={`View ${item.name}`}>
              <Image src={item.lens.src} alt={item.lens.alt} fill sizes="(max-width: 809px) 64vw, 450px" className={styles.lensImg} />
            </a>
            <div className={styles.meta}>
              <h3 className={styles.name}>{item.name}</h3>
              <p className="t-micro">
                {item.category} / {item.price}
              </p>
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
