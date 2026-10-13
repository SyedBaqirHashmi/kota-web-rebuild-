'use client';

import { useEffect, useRef, type JSX, type Ref, type VideoHTMLAttributes } from 'react';
import { disposeVideo, pickVideoSource } from '@/lib/media';
import { useMergedRefs } from '@/lib/refs';
import type { MediaVideo } from '@/types/content';

export interface LazyVideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'children' | 'poster'> {
  video: MediaVideo;
  /**
   * Extra gate on playback. A clip plays only while it is on screen AND active.
   * Use it for stacked clips (services) so only the visible one decodes.
   */
  active?: boolean;
  /** How far ahead of the viewport to start downloading. */
  preloadMargin?: string;
  ref?: Ref<HTMLVideoElement>;
}

/**
 * Muted, looping background video with a strict lifecycle:
 *  - `preload="none"` + no src in the markup: zero bytes until it nears the viewport.
 *  - one observer attaches the src ~1 screen early, then disconnects itself.
 *  - a second observer tracks visibility; off-screen or inactive = paused (no decode cost).
 *  - on unmount it is fully disposed (see cleanup): the video analogue of
 *    geometry.dispose() / texture.dispose() in WebGL.
 */
export function LazyVideo({ video, active = true, preloadMargin = '100% 0px', ref, ...rest }: LazyVideoProps): JSX.Element {
  const localRef = useRef<HTMLVideoElement | null>(null);
  const setRefs = useMergedRefs<HTMLVideoElement>(localRef, ref);
  const visibleRef = useRef<boolean>(false);
  const activeRef = useRef<boolean>(active);
  const attachedRef = useRef<boolean>(false);

  /** Single place that decides play vs pause. */
  const sync = (el: HTMLVideoElement): void => {
    if (visibleRef.current && activeRef.current) {
      if (!attachedRef.current) {
        const src = pickVideoSource(video.sources, el);
        if (!src) return;
        el.src = src; // set imperatively: React never owns `src`, so disposal is safe
        attachedRef.current = true;
      }
      // play() rejects if the element is detached mid-load or autoplay is blocked; both benign.
      el.play().catch(() => undefined);
    } else {
      el.pause();
    }
  };

  useEffect(() => {
    const el = localRef.current;
    if (!el) return;
    attachedRef.current = false;

    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (!attachedRef.current) {
          const src = pickVideoSource(video.sources, el);
          if (src) {
            el.src = src;
            attachedRef.current = true;
          }
        }
        preloadObserver.disconnect(); // one-shot
      },
      { rootMargin: preloadMargin },
    );

    const visibilityObserver = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      visibleRef.current = entry.isIntersecting;
      sync(el);
    });

    preloadObserver.observe(el);
    visibilityObserver.observe(el);

    return () => {
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
      visibleRef.current = false;
      attachedRef.current = false;
      // Disposal: pause, drop the source and reset the media pipeline, which
      // releases the decoder and its frame buffers now instead of at GC.
      disposeVideo(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video, preloadMargin]);

  // React to the `active` gate without re-creating observers.
  useEffect(() => {
    activeRef.current = active;
    if (localRef.current) sync(localRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <video
      ref={setRefs}
      poster={video.poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      {...rest}
    />
  );
}
