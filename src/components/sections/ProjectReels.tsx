'use client';

import type { JSX } from 'react';
import { LazyVideo } from '@/components/media/LazyVideo';
import type { SiteContent } from '@/types/content';
import styles from './ProjectReels.module.css';

export interface ProjectReelsProps {
  content: SiteContent['projectReels'];
}

export function ProjectReels({ content }: ProjectReelsProps): JSX.Element {
  return (
    <section id="projects" className={styles.section} data-nav-tone="dark" aria-labelledby="project-reels-title">
      <header className={styles.header}>
        <p className="t-micro">{content.label}</p>
        <h2 id="project-reels-title" className="t-h2">{content.title}</h2>
        <p className={`${styles.count} t-micro`}>{String(content.items.length).padStart(2, '0')} PROJECT FILMS / 2026</p>
      </header>

      <div className={styles.grid}>
        {content.items.map((item, index) => (
          <article
            key={item.id}
            className={styles.card}
            data-featured={item.featured || undefined}
            aria-labelledby={`project-${item.id}`}
          >
            <div className={styles.media}>
              <LazyVideo
                video={item.video}
                className={styles.video}
                preloadMargin="60% 0px"
                aria-hidden="true"
              />
              <span className={styles.number} aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className={styles.meta}>
              <h3 id={`project-${item.id}`} className="t-small">{item.title}</h3>
              <p className="t-micro">{item.category}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
