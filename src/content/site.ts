import type { ImageAsset, MediaVideo, SiteContent } from '@/types/content';

/*
 * Placeholder content. Structure mirrors the reference site; copy and media are
 * neutral stand-ins (do not ship another studio's copy or work).
 * Source files stay ASCII-only: typographic characters use \u escapes.
 */

const EM_DASH = '\u2014';

const projectVideo = (name: string): MediaVideo => ({
  sources: [{ src: `/media/projects/${name}.mp4`, type: 'video/mp4' }],
  poster: `/media/projects/${name}-poster.jpg`,
});

const introImage = (n: number): ImageAsset => ({
  src: `/media/intro/intro-${String(n).padStart(2, '0')}.jpg`,
  alt: '',
  width: 1200,
  height: 750,
});

export const site: SiteContent = {
  brand: {
    name: 'Code by Raza',
    wordmark: 'Code by Raza',
    email: 'SyedBaqirHashmi@users.noreply.github.com',
    timeZone: 'Asia/Karachi',
  },
  nav: {
    links: [
      { label: 'Home', href: '/' },
      { label: 'Work', href: '#projects' },
      { label: 'Insights (Soon)', href: '#', disabled: true },
    ],
    socials: [
      { label: 'GitHub', href: 'https://github.com/SyedBaqirHashmi' },
    ],
    cta: { label: 'View GitHub', href: 'https://github.com/SyedBaqirHashmi' },
  },
  intro: { images: [1, 2, 3, 4, 5, 6, 7, 8].map(introImage) },
  hero: {
    badge: 'Digital experiences by Syed Baqir Raza',
    availability: 'Available for new projects',
    seoTitle: `Turning bold ideas into high ${EM_DASH} impact digital experiences`,
    rows: [
      [{ kind: 'text', text: 'Turning ideas' }, { kind: 'gap' }, { kind: 'text', text: 'into' }],
      [{ kind: 'video' }, { kind: 'text', text: `high ${EM_DASH} impact` }],
      [{ kind: 'text', text: 'Digital' }, { kind: 'icon', src: '/media/spark.svg', alt: '' }, { kind: 'text', text: 'experiences' }],
    ],
    tagline: { strong: 'Code by Raza', rest: 'creates motion-rich websites, brand experiences and digital campaigns built to make an impression.' },
    background: { src: '/media/hero-bg.jpg', alt: '', width: 2400, height: 1350 },
    video: projectVideo('122985'),
  },
  playreel: { duration: '[ 00:23 ]', year: '\u00a92026', video: projectVideo('117685') },
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
        name: 'Web Experience',
        timeline: '1-2 weeks',
        deliverables: '1 page',
        description: 'A single page built to earn its traffic. For launches, campaigns and paid ads. Conversion-led and shipped fast.',
        priceFrom: 'Project based',
        video: projectVideo('117667'),
      },
      {
        id: 'marketing',
        name: 'Brand & Campaign',
        timeline: '4-6 weeks',
        deliverables: '5+ pages',
        description: 'A full website that tells your story and guides visitors through the right journey: Home, Product, Pricing, About.',
        priceFrom: 'Project based',
        video: projectVideo('117668'),
      },
      {
        id: 'motion',
        name: 'Motion & Content',
        timeline: '1-2 weeks',
        deliverables: 'Video, explainer or animation',
        description: 'Motion that makes your product feel alive. Launch videos, explainers and animation systems for your site.',
        priceFrom: 'Project based',
        video: projectVideo('117670'),
      },
    ],
  },
  testimonials: [
    {
      quote:
        '"Every project begins with the business goal, then earns its visual language through strategy, interaction and story."',
      author: `${EM_DASH} Strategy before decoration`,
    },
    {
      quote:
        '"Motion should guide attention, clarify hierarchy and make the experience memorable without getting in the user\u2019s way."',
      author: `${EM_DASH} Motion with purpose`,
    },
    {
      quote:
        '"The strongest digital work connects brand thinking, content, design and development as one continuous system."',
      author: `${EM_DASH} Built end to end`,
    },
  ],
  templates: {
    label: 'Featured Work',
    allHref: '#',
    items: ['Riverton', 'Noma', 'Artisan', 'Fragrance Lab', 'Ritual'].map((name, i) => ({
      id: name.toLowerCase(),
      name,
      category: ['Real estate', 'Architecture', 'Luxury', 'E-commerce', 'Beauty'][i] ?? 'Digital',
      price: '2026',
      href: '#',
      background: { src: `/media/templates/tpl-${i + 1}-bg.jpg`, alt: '', width: 2400, height: 1350 },
      lens: { src: `/media/templates/tpl-${i + 1}-lens.jpg`, alt: `${name} preview`, width: 1000, height: 1000 },
    })),
  },
  projectReels: {
    label: 'Project archive',
    title: 'Twenty glimpses into the work.',
    items: ([
      ['117665', 'Luxury Property', 'Real estate'],
      ['117667', 'Astra', 'Automotive experience'],
      ['117668', 'Noma', 'Architecture'],
      ['117670', 'Artisan', 'Luxury commerce'],
      ['117672', 'Riverton', 'Construction'],
      ['117675', 'Fleur', 'Editorial commerce'],
      ['117676', 'Rise', 'Property experience'],
      ['117677', 'Salem', 'Real estate'],
      ['117678', 'Built for More', 'Architecture'],
      ['117679', 'Arena', 'Sports venue'],
      ['117680', 'Fragrance Lab', 'E-commerce'],
      ['117682', 'Villa Study I', 'Property'],
      ['117683', 'Villa Study II', 'Property'],
      ['117684', 'Ritual', 'Beauty campaign'],
      ['117685', 'Between Frames', 'Motion showreel'],
      ['117687', 'Minimal Portfolio', 'Interactive design'],
      ['122892', 'Premium Web Details', 'Creative direction'],
      ['122904', 'Portfolio Interface', 'Interactive design'],
      ['122958', 'Experimental Archive', 'WebGL experience'],
      ['122985', 'Cinematic Sequence', 'Motion design'],
    ] as const).map(([id, title, category], index) => ({
      id,
      title,
      category,
      video: projectVideo(id),
      featured: index === 14 || index === 18 || index === 19,
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
  cta: { title: 'Let\u2019s build something memorable.', button: { label: 'View GitHub', href: 'https://github.com/SyedBaqirHashmi' } },
  footer: { credits: ['Designed by Syed Baqir Raza', 'Built with Next.js', 'Motion by Motion + Lenis'] },
};
