'use client';

import { useEffect, useMemo, useRef, type JSX } from 'react';
import { useLenis } from '@/components/providers/SmoothScrollProvider';
import { disposeVideo, pickVideoSource } from '@/lib/media';
import type { MediaVideo } from '@/types/content';
import styles from './ReelModal.module.css';

export interface ReelModalProps {
  open: boolean;
  onClose: () => void;
  video: MediaVideo;
  title: string;
}

/**
 * Full-screen reel player on the native <dialog>: focus trap, Escape and an inert
 * background come for free from showModal(). Smooth scroll pauses while open.
 * The <video> exists only while open and is disposed when it closes.
 */
export function ReelModal({ open, onClose, video, title }: ReelModalProps): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lenis = useLenis();
  const src = useMemo<string | null>(() => (open ? pickVideoSource(video.sources) : null), [open, video]);

  // open/close the native dialog in sync with React state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // scroll lock + playback lifecycle, scoped to the open period
  useEffect(() => {
    if (!open) return;
    const el = videoRef.current;
    lenis?.stop();
    el?.play().catch(() => undefined); // may reject if the user closes during load: harmless
    return () => {
      lenis?.start();
      disposeVideo(el);
    };
  }, [open, lenis]);

  // the native 'close' event covers Escape, the close button and backdrop clicks
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener('close', onClose);
    return () => dialog.removeEventListener('close', onClose);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) dialogRef.current?.close(); // backdrop click
      }}
    >
      {open && src && (
        <video ref={videoRef} className={styles.video} src={src} poster={video.poster} controls playsInline />
      )}
      <button type="button" className={styles.close} onClick={() => dialogRef.current?.close()} aria-label="Close reel">
        <span aria-hidden="true">{'\u00d7'}</span>
      </button>
    </dialog>
  );
}
