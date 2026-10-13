/** Content model. Everything the page renders is typed here and filled in src/content/site.ts. */

export interface VideoSource {
  src: string;
  /** MIME type incl. codecs when you know them, e.g. 'video/webm; codecs="vp9"'. */
  type: string;
}

export interface MediaVideo {
  sources: readonly VideoSource[];
  poster?: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface NavLink {
  label: string;
  href: string;
  disabled?: boolean;
}

/** Hero headline rows are a list of typed segments so media can sit inline with words. */
export type HeroSegment =
  | { kind: 'text'; text: string }
  | { kind: 'video' }               // the inline clip that morphs into the play-reel
  | { kind: 'icon'; src: string; alt: string }
  | { kind: 'gap' };                // fixed-width breathing room inside a row

export type HeroRow = readonly HeroSegment[];

export interface Fact {
  label: string;
  value: number;
  suffix: string;
  description: string;
}

export interface Service {
  id: string;
  name: string;
  timeline: string;
  deliverables: string;
  description: string;
  priceFrom: string;
  video: MediaVideo;
}

export interface Testimonial {
  quote: string;
  author: string;
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  price: string;
  href: string;
  background: ImageAsset;
  lens: ImageAsset;
}

export interface ProjectReel {
  id: string;
  title: string;
  category: string;
  video: MediaVideo;
  featured?: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface SiteContent {
  brand: { name: string; wordmark: string; email: string; timeZone: string };
  nav: { links: readonly NavLink[]; socials: readonly NavLink[]; cta: NavLink };
  intro: { images: readonly ImageAsset[] };
  hero: {
    badge: string;
    availability: string;
    seoTitle: string;
    rows: readonly HeroRow[];
    tagline: { strong: string; rest: string };
    background: ImageAsset;
    video: MediaVideo;
  };
  playreel: { duration: string; year: string; video: MediaVideo };
  about: { label: string; statement: string; facts: readonly Fact[] };
  services: { label: string; items: readonly Service[] };
  testimonials: readonly Testimonial[];
  templates: { label: string; items: readonly TemplateItem[]; allHref: string };
  projectReels: { label: string; title: string; items: readonly ProjectReel[] };
  faq: { title: string; askLabel: string; items: readonly FaqItem[] };
  cta: { title: string; button: NavLink };
  footer: { credits: readonly string[] };
}
