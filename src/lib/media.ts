import type { VideoSource } from '@/types/content';

/** First source the browser reports it can decode ('probably' | 'maybe'); falls back to the first. */
export function pickVideoSource(sources: readonly VideoSource[], probe?: HTMLVideoElement): string | null {
  if (typeof document === 'undefined') return sources[0]?.src ?? null;
  const el = probe ?? document.createElement('video');
  for (const s of sources) if (el.canPlayType(s.type) !== '') return s.src;
  return sources[0]?.src ?? null;
}

/**
 * Release a media element's decoder and buffers right now instead of at GC.
 * The DOM equivalent of geometry.dispose() / texture.dispose() in three.js.
 */
export function disposeVideo(el: HTMLVideoElement | null): void {
  if (!el) return;
  el.pause();
  el.removeAttribute('src');
  el.load();
}
