import { useEffect, useRef, useState } from "react";

/** Header chrome state: mobile menu, folder expansion, hide-on-scroll, and the rotating announcement bar. */
export function useHeaderChrome({ data, settings = {} }: { data: any; settings?: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [activeAnnIndex, setActiveAnnIndex] = useState(0);
  const lastScrollY = useRef(0);
  const hideOnScroll = settings.hideOnScroll !== false;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      setIsHidden(hideOnScroll && y > lastScrollY.current && y > 100);
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [hideOnScroll]);

  const announcements: Array<{ id: string; text: string; link?: string }> =
    data.announcements?.length > 0
      ? data.announcements
      : data.announcementText
        ? [{ id: "legacy", text: data.announcementText, link: data.announcementLink }]
        : [];
  const hasAnnouncement = !!data.showAnnouncement && announcements.length > 0;
  const rotates = hasAnnouncement && !data.announcementMarquee && announcements.length > 1;

  useEffect(() => {
    if (!rotates) return;
    const timer = setInterval(() => setActiveAnnIndex((i) => (i + 1) % announcements.length), 4000);
    return () => clearInterval(timer);
  }, [rotates, announcements.length]);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return {
    isMenuOpen,
    setIsMenuOpen,
    toggleMenu: () => setIsMenuOpen((v) => !v),
    expandedFolders,
    toggleFolder: (folderId: string) =>
      setExpandedFolders((prev) => (prev.includes(folderId) ? prev.filter((x) => x !== folderId) : [...prev, folderId])),
    isHidden,
    announcements,
    hasAnnouncement,
    announcementHeight: isMobile ? 36 : 40,
    activeAnnIndex,
  };
}
