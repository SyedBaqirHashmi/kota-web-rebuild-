import type { JSX } from 'react';
import { BackToTop } from '@/components/ui/BackToTop';
import { GlassButton } from '@/components/ui/GlassButton';
import { LiveClock } from '@/components/ui/LiveClock';
import type { SiteContent } from '@/types/content';
import styles from './CtaFooter.module.css';

export interface CtaFooterProps {
  cta: SiteContent['cta'];
  footer: SiteContent['footer'];
  nav: SiteContent['nav'];
  brand: SiteContent['brand'];
}

/**
 * Curtain reveal: the CTA is `position: sticky` and stays put while the footer
 * slides up over it. The footer's top edge is a progressive blur: two
 * backdrop-filter layers (4 px, 10 px), each masked to a different band of a
 * gradient, then a solid fade to black. No JavaScript involved.
 * Server component; only the clock and back-to-top button hydrate.
 */
export function CtaFooter({ cta, footer, nav, brand }: CtaFooterProps): JSX.Element {
  return (
    <div className={styles.wrap}>
      <section className={styles.cta} data-nav-tone="light" aria-labelledby="cta-title">
        <h2 id="cta-title" className={`${styles.ctaTitle} t-h2`}>{cta.title}</h2>
        <GlassButton tone="light" size="md" href={cta.button.href}>
          {cta.button.label}
        </GlassButton>
      </section>

      <footer className={styles.footer} data-nav-tone="dark">
        <div className={styles.blurBand} aria-hidden="true">
          <span className={styles.blurSoft} />
          <span className={styles.blurStrong} />
          <span className={styles.solid} />
        </div>

        <div className={styles.body}>
          <div className={styles.top}>
            <ul className={`${styles.credits} t-micro`}>
              {footer.credits.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <nav className={styles.cols} aria-label="Footer">
              <div>
                <p className={`${styles.colTitle} t-micro`}>Index</p>
                <ul className="t-lead">
                  {nav.links.filter((l) => !l.disabled).map((l) => (
                    <li key={l.label}><a href={l.href}>{l.label}</a></li>
                  ))}
                  <li><a href={nav.cta.href}>Contact</a></li>
                </ul>
              </div>
              <div>
                <p className={`${styles.colTitle} t-micro`}>Socials</p>
                <ul className="t-lead">
                  {nav.socials.map((s) => (
                    <li key={s.label}><a href={s.href} target="_blank" rel="noreferrer noopener">{s.label}</a></li>
                  ))}
                </ul>
              </div>
            </nav>
          </div>

          <hr className={styles.rule} />

          {/* Wordmark: SVG textLength stretches the spacing so it always spans the full width, at any font. */}
          <svg className={styles.wordmark} viewBox="0 0 1200 200" aria-hidden="true" preserveAspectRatio="xMidYMid meet">
            <text x="0" y="168" textLength="1200" lengthAdjust="spacing">{brand.wordmark}</text>
          </svg>

          <div className={styles.bottom}>
            <LiveClock timeZone={brand.timeZone} className="t-micro" offsetClassName={styles.muted} />
            <BackToTop />
          </div>
        </div>
      </footer>
    </div>
  );
}
