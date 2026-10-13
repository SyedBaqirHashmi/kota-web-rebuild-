import type { Metadata, Viewport } from 'next';
import type { JSX, ReactNode } from 'react';
// Self-hosted variable font via Fontsource (no next/font, no runtime Google request).
import '@fontsource-variable/inter-tight';
import './globals.css';

export const metadata: Metadata = {
  title: 'Your Studio - Motion-first websites',
  description: 'A faithful rebuild of a motion-rich studio site: loader, video morph, sticky services, scroll-reveal testimonials and a clip-path portfolio lens.',
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
};

export interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
