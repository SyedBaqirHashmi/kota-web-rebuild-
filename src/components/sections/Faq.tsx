'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useId, useState, type JSX } from 'react';
import { GlassButton } from '@/components/ui/GlassButton';
import { EASE_FILM } from '@/lib/motion';
import type { FaqItem, SiteContent } from '@/types/content';
import styles from './Faq.module.css';

export interface FaqProps {
  content: SiteContent['faq'];
  email: string;
}

interface AccordionItemProps {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}

function AccordionItem({ item, open, onToggle }: AccordionItemProps): JSX.Element {
  const uid = useId();
  const buttonId = `${uid}-q`;
  const panelId = `${uid}-a`;
  return (
    <div className={styles.item} data-open={open}>
      <h3>
        <button id={buttonId} type="button" className={styles.question} aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
          <span>{item.question}</span>
          <span className={styles.icon} aria-hidden="true" />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={buttonId}
            className={styles.answerWrap}
            // height: 'auto' is measured once by Motion, then tweened in px.
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_FILM }}
          >
            <p className={`${styles.answer} t-small`}>{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Two-column FAQ. Items are independent (several can be open). The "+" rotates
 * 45 deg into an "x" in CSS; the panel animates height with Motion and the
 * closed panel is unmounted (no hidden text left in the tab order).
 */
export function Faq({ content, email }: FaqProps): JSX.Element {
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(() => new Set([content.items[0]?.id ?? '']));
  const toggle = (id: string): void =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const half = Math.ceil(content.items.length / 2);
  const columns: ReadonlyArray<readonly FaqItem[]> = [content.items.slice(0, half), content.items.slice(half)];

  return (
    <section className={styles.section} data-nav-tone="light" aria-labelledby="faq-title">
      <div className={styles.head}>
        <h2 id="faq-title" className={`${styles.title} t-h3`}>{content.title}</h2>
        <GlassButton tone="light" size="sm" href={`mailto:${email}`}>
          {content.askLabel}
        </GlassButton>
      </div>
      <div className={styles.grid}>
        {columns.map((col, c) => (
          <div key={c} className={styles.column}>
            {col.map((item) => (
              <AccordionItem key={item.id} item={item} open={openIds.has(item.id)} onToggle={() => toggle(item.id)} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
