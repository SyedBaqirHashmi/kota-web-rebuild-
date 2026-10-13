import type { JSX } from 'react';
import { site } from '@/content/site';
import { VideoMorphProvider } from '@/components/morph/VideoMorph';
import { IntroProvider } from '@/components/providers/IntroProvider';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';
import { About } from '@/components/sections/About';
import { CtaFooter } from '@/components/sections/CtaFooter';
import { Faq } from '@/components/sections/Faq';
import { Hero } from '@/components/sections/Hero';
import { Loader } from '@/components/sections/Loader';
import { Nav } from '@/components/sections/Nav';
import { Playreel } from '@/components/sections/Playreel';
import { ProjectReels } from '@/components/sections/ProjectReels';
import { Services } from '@/components/sections/Services';
import { TemplatesGallery } from '@/components/sections/TemplatesGallery';
import { Testimonials } from '@/components/sections/Testimonials';

/**
 * Page composition. This file is a Server Component: it only wires content into
 * sections. Providers are client components that wrap the tree:
 *   SmoothScroll (Lenis) > Intro (shared loader clock) > VideoMorph (hero -> reel)
 */
export default function HomePage(): JSX.Element {
  return (
    <SmoothScrollProvider>
      <IntroProvider>
        <VideoMorphProvider>
          <Loader images={site.intro.images} brand={site.brand.name} />
          <Nav brand={site.brand.name} links={site.nav.links} socials={site.nav.socials} cta={site.nav.cta} />
          <main>
            <Hero content={site.hero} timeZone={site.brand.timeZone} />
            <Playreel content={site.playreel} />
            <About content={site.about} />
            <Services content={site.services} contactHref={site.nav.cta.href} />
            <Testimonials items={site.testimonials} />
            <TemplatesGallery content={site.templates} />
            <ProjectReels content={site.projectReels} />
            <Faq content={site.faq} email={site.brand.email} />
          </main>
          <CtaFooter cta={site.cta} footer={site.footer} nav={site.nav} brand={site.brand} />
        </VideoMorphProvider>
      </IntroProvider>
    </SmoothScrollProvider>
  );
}
