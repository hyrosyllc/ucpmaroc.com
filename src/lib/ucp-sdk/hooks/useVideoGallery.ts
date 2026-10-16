import { useCallback, useEffect, useState } from "react";

export function getYoutubeId(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
}

export interface VideoItem {
  url: string;
  title?: string;
  caption?: string;
}

/** Index, lightbox, and URL helpers for video sections (YouTube links and uploaded files). */
export function useVideoGallery(videos: VideoItem[] = [], isPreview = false) {
  const [current, setCurrent] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const count = videos.length;
  const lightboxOpen = lightboxIndex !== null;

  // Page scroll is locked while the lightbox is open.
  useEffect(() => {
    document.body.style.overflow = lightboxOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  const next = useCallback(() => setCurrent((i) => (count ? (i + 1) % count : 0)), [count]);
  const prev = useCallback(() => setCurrent((i) => (count ? (i - 1 + count) % count : 0)), [count]);

  // In the builder, clicks edit the section instead of opening the player.
  const openLightbox = useCallback((index: number) => {
    if (!isPreview) setLightboxIndex(index);
  }, [isPreview]);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const nextInLightbox = useCallback(() => setLightboxIndex((i) => (i === null || !count ? i : (i + 1) % count)), [count]);
  const prevInLightbox = useCallback(() => setLightboxIndex((i) => (i === null || !count ? i : (i - 1 + count) % count)), [count]);

  return {
    count,
    current,
    next,
    prev,
    goTo: setCurrent,
    lightboxOpen,
    lightboxIndex: lightboxIndex ?? 0,
    lightboxVideo: lightboxIndex !== null ? videos[lightboxIndex] : null,
    openLightbox,
    closeLightbox,
    nextInLightbox,
    prevInLightbox,
    isYoutube: (url?: string) => !!getYoutubeId(url),
    thumbnail: (url?: string) => {
      const id = getYoutubeId(url);
      return id ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg` : null;
    },
    embedUrl: (url?: string) => {
      const id = getYoutubeId(url);
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
    },
  };
}
