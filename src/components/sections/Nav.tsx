'use client';

import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useCallback, useEffect, useId, useRef, useState, type JSX } from 'react';
import { useIntro } from '@/components/providers/IntroProvider';
import { GlassButton, type GlassTone } from '@/components/ui/GlassButton';
import { EASE_OUT_SOFT, MENU, SPRING_SMOOTH } from '@/lib/motion';
import type { NavLink } from '@/types/content';
import styles from './Nav.module.css';

export interface NavProps {
  brand: string;
  links: readonly NavLink[];
  socials: readonly NavLink[];
  cta: NavLink;
}

const listVariants: Variants = {
  closed: {},
  open: { transition: { staggerChildren: MENU.stagger } },
};

const itemVariants: Variants = {
  closed: { opacity: 0, y: MENU.linkY },
  open: { opacity: 1, y: 0, transition: { duration: MENU.linkDuration, ease: EASE_OUT_SOFT } },
};

/**
 * Fixed glass header. Two behaviours worth noting:
 *  - Tone switching: every top-level section declares data-nav-tone="dark|light".
 *    One IntersectionObserver watches a thin band at the top of the viewport and
 *    flips the glass between dark/light variants. No scroll listener at all.
 *  - Menu: glass dropdown from the center button; links stagger in 50 ms apart
 *    (y 12 -> 0, 180 ms). Escape / outside click close it and focus returns to the trigger.
 */
export function Nav({ brand, links, socials, cta }: NavProps): JSX.Element {
  const { chromeDelay } = useIntro();
  const [tone, setTone] = useState<GlassTone>('dark');
  const [open, setOpen] = useState<boolean>(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  // --- tone detection -------------------------------------------------------
  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-tone]'));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const value = entry.target.getAttribute('data-nav-tone');
          if (value === 'dark' || value === 'light') setTone(value);
        }
      },
      // A 5%-tall band at the very top: only the section *under the header* counts.
      { rootMargin: '0px 0px -95% 0px' },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // --- menu a11y: escape, outside click, focus management ----------------------
  const close = useCallback((returnFocus: boolean): void => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') close(true);
    };
    const onPointer = (e: PointerEvent): void => {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, close]);

  return (
    <motion.header
      className={styles.header}
      data-tone={tone}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SMOOTH, delay: chromeDelay }}
    >
      <div className={styles.left}>
        <GlassButton href="/" tone={tone} size="sm" className={styles.brand} aria-label={`${brand} home`}>
          {brand}
        </GlassButton>
      </div>

      <div className={styles.center}>
        <GlassButton
          ref={triggerRef}
          tone={tone}
          size="icon"
          aria-expanded={open}
          aria-controls={menuId}
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.burger} data-open={open} aria-hidden="true">
            <span />
            <span />
          </span>
        </GlassButton>

        <AnimatePresence>
          {open && (
            <motion.div
              ref={panelRef}
              id={menuId}
              className={styles.panel}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE_OUT_SOFT }}
            >
              <motion.ul variants={listVariants} initial="closed" animate="open" className={styles.links}>
                {links.map((link, i) => (
                  <motion.li key={link.label} variants={itemVariants}>
                    <a
                      ref={i === 0 ? firstLinkRef : undefined}
                      href={link.disabled ? undefined : link.href}
                      aria-disabled={link.disabled || undefined}
                      className={styles.link}
                      onClick={() => close(false)}
                    >
                      {link.label}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
              <motion.ul variants={listVariants} initial="closed" animate="open" className={styles.socials}>
                {socials.map((s) => (
                  <motion.li key={s.label} variants={itemVariants}>
                    <a href={s.href} target="_blank" rel="noreferrer noopener">
                      {s.label}
                    </a>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className={styles.right}>
        <GlassButton href={cta.href} tone={tone} size="sm">
          {cta.label}
        </GlassButton>
      </div>
    </motion.header>
  );
}
