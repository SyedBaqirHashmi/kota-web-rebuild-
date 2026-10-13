import type { ImageAsset, MediaVideo, SiteContent } from '@/types/content';

/*
 * Placeholder content. Structure mirrors the reference site; copy and media are
 * neutral stand-ins (do not ship another studio's copy or work).
 * Source files stay ASCII-only: typographic characters use \u escapes.
 */

const EM_DASH = '\u2014';

const video = (name: string): MediaVideo => ({
  // Order matters: LazyVideo picks the first type the browser can decode.
  sources: [
    { src: `/media/video/${name}.webm`, type: 'video/webm; codecs="vp9"' },
    { src: `/media/video/${name}.mp4`, type: 'video/mp4; codecs="avc1.42E01E"' },
  ],
  poster: `/media/video/${name}-poster.jpg`,
});

const introImage = (n: number): ImageAsset => ({
  src: `/media/intro/intro-${String(n).padStart(2, '0')}.jpg`,
  alt: '',
  width: 1200,
  height: 750,
});

export const site: SiteContent = {
  brand: {
    name: 'Your Studio',
    wordmark: 'Your Studio',
    email: 'hello@example.com',
    timeZone: 'Asia/Karachi',
  },
  nav: {
    links: [
      { label: 'Home', href: '/' },
      { label: 'Work', href: '#templates' },
      { label: 'Insights (Soon)', href: '#', disabled: true },
    ],
    socials: [
      { label: 'X (Twitter)', href: 'https://x.com' },
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'Threads', href: 'https://threads.net' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
    ],
    cta: { label: 'Get in touch', href: 'mailto:hello@example.com' },
  },
  intro: { images: [1, 2, 3, 4, 5, 6, 7, 8].map(introImage) },
  hero: {
    badge: 'Independent design studio',
    availability: 'Available for new projects',
    seoTitle: `Turning ideas into high ${EM_DASH} impact websites`,
    rows: [
      [{ kind: 'text', text: 'Turning ideas' }, { kind: 'gap' }, { kind: 'text', text: 'into' }],
      [{ kind: 'video' }, { kind: 'text', text: `high ${EM_DASH} impact` }],
      [{ kind: 'text', text: 'Motion' }, { kind: 'icon', src: '/media/spark.svg', alt: '' }, { kind: 'text', text: 'websites' }],
    ],
    tagline: { strong: 'Your Studio', rest: 'creates motion-rich, interactive websites that engage users and boost conversions.' },
    background: { src: '/media/hero-bg.jpg', alt: '', width: 2400, height: 1350 },
    video: video('reel'),
  },
  playreel: { duration: '[ 00:06 ]', year: '\u00a92026', video: video('reel') },
  about: {
    label: 'About',
    statement:
      `You have already built something great. Whether it is just taking shape or already scaling ${EM_DASH} it deserves a website that matches the work you have put in.`,
    facts: [
      { label: 'Projects completed', value: 15, suffix: '+', description: 'Websites designed and shipped for founders, SaaS teams and agencies.' },
      { label: 'Average launch time', value: 3, suffix: ' wks', description: 'From kickoff call to a live, production-ready site.' },
      { label: 'Client retention', value: 92, suffix: '%', description: 'Most clients come back for the next launch.' },
    ],
  },
  services: {
    label: 'Our Services',
    items: [
      {
        id: 'landing',
        name: 'Landing Page',
        timeline: '1-2 weeks',
        deliverables: '1 page',
        description: 'A single page built to earn its traffic. For launches, campaigns and paid ads. Conversion-led and shipped fast.',
        priceFrom: '$4,000',
        video: video('service-1'),
      },
      {
        id: 'marketing',
        name: 'Marketing Site',
        timeline: '4-6 weeks',
        deliverables: '5+ pages',
        description: 'A full website that tells your story and guides visitors through the right journey: Home, Product, Pricing, About.',
        priceFrom: '$6,000',
        video: video('service-2'),
      },
      {
        id: 'motion',
        name: 'Motion Design',
        timeline: '1-2 weeks',
        deliverables: 'Video, explainer or animation',
        description: 'Motion that makes your product feel alive. Launch videos, explainers and animation systems for your site.',
        priceFrom: '$3,000',
        video: video('service-3'),
      },
    ],
  },
  testimonials: [
    {
      quote:
        '"The final website turned out exactly as I envisioned it. Communication was excellent throughout; the team was quick to respond, clear about what was going on, and worked hard to hit our goals."',
      author: `${EM_DASH} Client Name, Company`,
    },
    {
      quote:
        '"They helped us from the ground up, refining and carefully building an eye-catching landing page with wonderful animations, themes and font selections. Everything shows expertise."',
      author: `${EM_DASH} Client Name, Company`,
    },
    {
      quote:
        '"Professional, dedicated and thoughtful. Meticulous about every detail and genuinely invested in the product. We will keep working together on the next projects."',
      author: `${EM_DASH} Client Name, Company`,
    },
  ],
  templates: {
    label: 'Featured Work',
    allHref: '#',
    items: ['Orbit', 'Ledger', 'Cortex', 'Atrium', 'Folio'].map((name, i) => ({
      id: name.toLowerCase(),
      name,
      category: ['Agency', 'Finance', 'AI', 'Studio', 'Portfolio'][i] ?? 'Agency',
      price: '$99',
      href: '#',
      background: { src: `/media/templates/tpl-${i + 1}-bg.jpg`, alt: '', width: 2400, height: 1350 },
      lens: { src: `/media/templates/tpl-${i + 1}-lens.jpg`, alt: `${name} preview`, width: 1000, height: 1000 },
    })),
  },
  faq: {
    title: 'Question before you decide.',
    askLabel: 'Ask a question',
    items: [
      { id: 'who', question: 'Who is this for?', answer: 'Founders, SaaS teams and agency owners who need a site that looks like a premium build without the premium timeline.' },
      { id: 'help', question: 'What do you actually help with?', answer: 'Strategy, design, build and launch. One team from first call to live site.' },
      { id: 'build', question: 'Do you design and also build the site?', answer: 'Yes. Design and development happen in-house, so nothing gets lost in hand-off.' },
      { id: 'scratch', question: 'Can you build my site from scratch?', answer: 'Yes. Bring a brief or a blank page; we will shape it together.' },
      { id: 'cost', question: 'How much does it cost?', answer: 'Landing pages start at $4k and marketing sites at $6k. Motion work is quoted by scope.' },
      { id: 'start', question: 'How fast can you start?', answer: 'Usually within one to two weeks of signing.' },
      { id: 'process', question: 'How do we work together day to day?', answer: 'A shared channel, weekly check-ins and a live staging link you can open any time.' },
      { id: 'after', question: 'What happens after the site launches?', answer: 'Two weeks of post-launch support are included, with ongoing care plans available.' },
    ],
  },
  cta: { title: 'Let\u2019s get started!', button: { label: 'Start a project', href: 'mailto:hello@example.com' } },
  footer: { credits: ['Designed by Your Studio', 'Built with Next.js', 'Motion by Motion + Lenis'] },
};
