import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  ArrowRight,
  ShoppingBag,
  Instagram,
  Twitter,
  Youtube,
  Film,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk"; // 🚀 The Platform SDK
import type { HeaderSectionProps } from "@/features/portfolio-builder/types/sections";

// ==========================================
// 1. THEME CUSTOM SCHEMA
// ==========================================
export const schema = [
  {
    id: "glassStrength",
    type: "slider",
    min: 0,
    max: 20,
    label: "Blur Strength",
    defaultValue: 12,
  },
  {
    id: "hideOnScroll",
    type: "toggle",
    label: "Hide on Scroll Down",
    defaultValue: true,
  },
  {
    id: "glowColor",
    type: "color",
    label: "Island Glow Color",
    defaultValue: "rgba(0, 0, 0, 0.05)",
  },
  {
    id: "glowSize",
    type: "slider",
    min: 0,
    max: 50,
    label: "Glow Spread",
    defaultValue: 20,
  },
];

// ==========================================
// 2. THE COMPONENT
// ==========================================
export default function CupertinoHeader({
  data,
  settings = {},
  allSections,
  theme,
  isPreview,
  id,
}: HeaderSectionProps & any) {
  // --- 🚀 PLATFORM SDK (The Heavy Lifting) ---
  const { isScrolled } = UCP.useScrollObserver(20);
  const { cartCount, openCart } = UCP.useCart();
  const { menuTree, handleNavClick } = UCP.useNavigationTree({
    data,
    allSections,
    theme,
    isPreview,
  });

  // --- THEME LOCAL STATE ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [isHidden, setIsHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [activeAnnIndex, setActiveAnnIndex] = useState(0);

  // --- SMART HIDE LOGIC (Theme Specific) ---
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      if (
        settings.hideOnScroll !== false &&
        scrollY > lastScrollY &&
        scrollY > 100
      ) {
        setIsHidden(true);
      } else {
        setIsHidden(false);
      }
      setLastScrollY(scrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, settings.hideOnScroll]);

  const toggleMobileFolder = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  // --- ANNOUNCEMENT COMPILER ---
  const announcementsList =
    data.announcements?.length > 0
      ? data.announcements
      : data.announcementText
      ? [
          {
            id: "legacy",
            text: data.announcementText,
            link: data.announcementLink,
          },
        ]
      : [];
  const hasAnnouncement = data.showAnnouncement && announcementsList.length > 0;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const announcementHeight = isMobile ? 36 : 40;

  useEffect(() => {
    if (
      hasAnnouncement &&
      !data.announcementMarquee &&
      announcementsList.length > 1
    ) {
      const timer = setInterval(
        () =>
          setActiveAnnIndex((prev) => (prev + 1) % announcementsList.length),
        4000
      );
      return () => clearInterval(timer);
    }
  }, [hasAnnouncement, data.announcementMarquee, announcementsList.length]);

  const RenderAnnouncement = ({ ann }: { ann: any }) =>
    ann.link ? (
      <a
        href={ann.link}
        className="hover:opacity-80 transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
      >
        <span>{ann.text}</span>
        <ArrowRight size={12} />
      </a>
    ) : (
      <span className="whitespace-nowrap">{ann.text}</span>
    );

  const hasSocial =
    data.socialInstagram ||
    data.socialTwitter ||
    data.socialYoutube ||
    data.socialImdb;

  return (
    <>
      {/* 🚀 PLATFORM UI: Announcement Bar */}
      {hasAnnouncement && (
        <div
          className="relative w-full overflow-hidden flex items-center justify-center font-medium z-[60] text-[11px] md:text-[13px] tracking-wide"
          style={{
            height: `${announcementHeight}px`,
            backgroundColor: data.announcementBgColor || "var(--primary)",
            color: data.announcementTextColor || "#ffffff",
          }}
        >
          {data.announcementMarquee ? (
            <div className="w-full h-full flex items-center px-4 justify-start">
              <div className="flex items-center gap-12 animate-custom-marquee pr-12">
                {[...Array(4)].map((_, arrayIndex) => (
                  <React.Fragment key={`loop-${arrayIndex}`}>
                    {announcementsList.map((ann: any, i: number) => (
                      <div
                        key={`item-${arrayIndex}-${i}`}
                        className="flex items-center gap-12"
                      >
                        <RenderAnnouncement ann={ann} />
                        <span className="opacity-50 text-[8px]">•</span>
                      </div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center px-4 relative">
              {announcementsList.map((ann: any, i: number) => (
                <div
                  key={`fade-${i}`}
                  className={cn(
                    "absolute transition-opacity duration-500 ease-in-out",
                    i === activeAnnIndex
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  )}
                >
                  <RenderAnnouncement ann={ann} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🚀 THEME UI: Cupertino Floating Island */}
      <header
        className={cn(
          "fixed left-0 right-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isHidden ? "-translate-y-[150%]" : "translate-y-0",
          hasAnnouncement && !isScrolled ? "top-14" : "top-6" // Accounts for announcement bar
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between px-6 transition-all duration-500 relative",
            isScrolled
              ? "max-w-4xl bg-white/70 rounded-full py-3 border border-gray-200/50"
              : "max-w-7xl py-6 bg-transparent"
          )}
          style={{
            backdropFilter: isScrolled
              ? `blur(${settings.glassStrength ?? 12}px)`
              : "none",
            WebkitBackdropFilter: isScrolled
              ? `blur(${settings.glassStrength ?? 12}px)`
              : "none",
            boxShadow: isScrolled
              ? `0 10px ${settings.glowSize ?? 20}px ${
                  settings.glowColor ?? "rgba(0,0,0,0.05)"
                }`
              : "none",
          }}
        >
          {/* LOGO */}
          <div
            className="font-semibold tracking-tight text-lg text-slate-900 shrink-0 cursor-pointer"
            onClick={() => handleNavClick({ type: "section", id: "hero" })}
          >
            {data.logoImage ? (
              <img
                src={data.logoImage}
                alt="Logo"
                className="w-auto object-contain h-8 md:h-10"
              />
            ) : (
              <UCP.Text
                as="span"
                field="logoText"
                value={data.logoText || "BRAND."}
                sectionId={id}
                isPreview={isPreview}
              />
            )}
          </div>

          {/* DESKTOP NAV (SDK Powered) */}
          <nav className="hidden md:flex items-center gap-1">
            {menuTree.map((item: any) => {
              if (item.type === "folder") {
                return (
                  <div key={item.id} className="relative group px-1 py-4 -my-4">
                    <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100/50">
                      {item.label}{" "}
                      <ChevronDown
                        size={14}
                        className="group-hover:rotate-180 transition-transform duration-200"
                      />
                    </button>
                    <div className="absolute top-full left-0 pt-3 w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                      <div className="rounded-2xl bg-white/95 backdrop-blur-xl border border-gray-200 shadow-xl overflow-hidden p-2 flex flex-col gap-1">
                        {item.children.map((child: any) => (
                          <button
                            key={child.id}
                            onClick={() => handleNavClick(child)}
                            className="text-left px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-colors"
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100/50"
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* RIGHT SIDE ACTIONS */}
          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            {hasSocial && (
              <div className="hidden md:flex items-center gap-3 px-3 text-slate-400 border-r border-gray-200 pr-4 mr-2">
                {data.socialInstagram && (
                  <a
                    href={data.socialInstagram}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-900"
                  >
                    <Instagram size={16} />
                  </a>
                )}
                {data.socialTwitter && (
                  <a
                    href={data.socialTwitter}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-900"
                  >
                    <Twitter size={16} />
                  </a>
                )}
                {data.socialYoutube && (
                  <a
                    href={data.socialYoutube}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-900"
                  >
                    <Youtube size={16} />
                  </a>
                )}
                {data.socialImdb && (
                  <a
                    href={data.socialImdb}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-slate-900"
                  >
                    <Film size={16} />
                  </a>
                )}
              </div>
            )}

            <button
              onClick={openCart}
              className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {data.ctaText && (
              <button
                onClick={() =>
                  handleNavClick({
                    type: "custom_link",
                    url: data.ctaLink || "#contact",
                  })
                }
                className="hidden md:block bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <UCP.Text
                  as="span"
                  field="ctaText"
                  value={data.ctaText}
                  sectionId={id}
                  isPreview={isPreview}
                />
              </button>
            )}

            <button
              className="md:hidden p-2 text-slate-900"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>

      {/* 🚀 THEME UI: Mobile Menu (Apple Blur Style + Accordions) */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-white/90 backdrop-blur-2xl md:hidden flex flex-col items-center justify-start transition-all duration-500 ease-in-out overflow-y-auto",
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <button
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 z-10"
          onClick={() => setIsMenuOpen(false)}
        >
          <X size={32} />
        </button>

        <div className="flex flex-col items-center w-full px-8 pt-24 pb-20 gap-8 min-h-full">
          {menuTree.map((item: any, idx: number) => {
            if (item.type === "folder") {
              const isExpanded = expandedFolders.includes(item.id);
              return (
                <div
                  key={item.id}
                  className="w-full flex flex-col items-center"
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <button
                    onClick={() => toggleMobileFolder(item.id)}
                    className={cn(
                      "flex items-center gap-2 text-3xl font-bold text-slate-900 transition-all duration-300 transform",
                      isMenuOpen
                        ? "translate-y-0 opacity-100"
                        : "translate-y-8 opacity-0"
                    )}
                  >
                    {item.label}{" "}
                    <ChevronDown
                      size={24}
                      className={cn(
                        "transition-transform duration-300",
                        isExpanded && "rotate-180 text-blue-600"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "flex flex-col items-center gap-5 overflow-hidden transition-all duration-300 ease-in-out",
                      isExpanded
                        ? "max-h-[500px] mt-6 opacity-100"
                        : "max-h-0 mt-0 opacity-0"
                    )}
                  >
                    {item.children.map((child: any) => (
                      <button
                        key={child.id}
                        onClick={() => handleNavClick(child)}
                        className="text-xl font-medium text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "text-3xl font-bold text-slate-900 transition-all duration-300 transform",
                  isMenuOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                )}
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                {item.label}
              </button>
            );
          })}

          {/* Mobile Socials Block */}
          {hasSocial && (
            <div
              className={cn(
                "flex items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-200 w-full max-w-[200px] transition-all duration-500",
                isMenuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              )}
              style={{ transitionDelay: `${menuTree.length * 50 + 50}ms` }}
            >
              {data.socialInstagram && (
                <a
                  href={data.socialInstagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-900"
                >
                  <Instagram size={24} />
                </a>
              )}
              {data.socialTwitter && (
                <a
                  href={data.socialTwitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-900"
                >
                  <Twitter size={24} />
                </a>
              )}
              {data.socialYoutube && (
                <a
                  href={data.socialYoutube}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-900"
                >
                  <Youtube size={24} />
                </a>
              )}
              {data.socialImdb && (
                <a
                  href={data.socialImdb}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-slate-900"
                >
                  <Film size={24} />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

CupertinoHeader.schema = schema;
