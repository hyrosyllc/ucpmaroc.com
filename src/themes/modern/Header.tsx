import React, { useState, useEffect } from "react";
import { BlockProps } from "../types";
import { Button } from "@/components/ui/button";
import {
  Menu,
  X,
  ArrowRight,
  ShoppingBag,
  Instagram,
  Twitter,
  Youtube,
  Film,
  ChevronDown, // 🚀 NEW: Added for the dropdown arrows
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { InlineEdit } from "../../components/dashboard/InlineEdit";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  isHome: boolean;
}

const Header: React.FC<any> = ({
  data,
  settings = {},
  allSections,
  isPreview,
  id,
  theme,
  themeConfig,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeAnnIndex, setActiveAnnIndex] = useState(0);
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]); // 🚀 NEW: Mobile Accordion State

  const sections = allSections || [];
  const variant = settings.variant || data.variant || "transparent";
  const isSticky = settings.isSticky !== undefined ? settings.isSticky : data.isSticky !== false;

  const { openCart, getCartCount } = useCartStore();
  const cartCount = getCartCount();

  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ slug?: string; username?: string }>();

  const activeTheme = theme || themeConfig || {};
  const customPages: CustomPage[] =
    activeTheme.customPages || data.customPages || [];
  const publicSlug = activeTheme.publicSlug || data.publicSlug || "";

  const username = params.slug || params.username || publicSlug || "portfolio";
  const pathPrefix = location.pathname.startsWith("/pro") ? "/pro" : "";

  // 🚀 UPGRADED: 2D Mega Menu Tree Generator & Custom Page Bug Fix
  const menuItems = React.useMemo(() => {
    const flatItems: Array<any> = [];
    const config = data.menuConfig || {};
    const isMegaMenu = data.menuType === "mega";
    const isAutoMenu = data.autoMenu !== false && !isMegaMenu;
    // 1. Shop Page
    if (!config.page_shop || config.page_shop.visible !== false) {
      flatItems.push({
        label: config.page_shop?.label || "Shop",
        id: "page_shop",
        type: "page",
        url: `${pathPrefix}/${username}/shop`,
        folderId: config.page_shop?.folderId,
      });
    }

    // 2. Custom Pages (🚀 BUG FIXED: Defaults to visible if config is missing)
    customPages
      .filter((p) => !p.isHome)
      .forEach((p) => {
        const pageConfig = config[`page_${p.id}`];
        if (!pageConfig || pageConfig.visible !== false) {
          flatItems.push({
            label: pageConfig?.label || p.title,
            id: `page_${p.id}`,
            type: "page",
            url: `${pathPrefix}/${username}/${p.slug}`,
            folderId: pageConfig?.folderId,
          });
        }
      });

    // 3. Custom Links
    const customNavLinks = data.customNavLinks || [];
    customNavLinks.forEach((link: any) => {
      if (link.label && link.url && link.visible !== false) {
        flatItems.push({
          label: link.label,
          id: link.id,
          type: "custom_link",
          url: link.url,
          folderId: link.folderId,
        });
      }
    });

    // 4. On-Page Sections
    sections
      .filter((s: any) => s.isVisible && s.type !== "header")
      .forEach((s: any) => {
        const secConfig = config[s.id];
        if (isAutoMenu) {
          // Auto-menu ignores manual visibility, but still respects mega-menu folders!
          if (s.data.title)
            flatItems.push({
              label: s.data.title || s.type,
              id: s.id,
              type: "section",
              folderId: secConfig?.folderId,
            });
        } else {
          if (!secConfig || secConfig.visible !== false) {
            flatItems.push({
              label: secConfig?.label || s.data.title || s.type,
              id: s.id,
              type: "section",
              folderId: secConfig?.folderId,
            });
          }
        }
      });

    // 🚀 Sort flatItems based on the dragged menuOrder
    if (data.menuOrder && Array.isArray(data.menuOrder)) {
      flatItems.sort((a, b) => {
        const idxA = data.menuOrder.indexOf(a.id);
        const idxB = data.menuOrder.indexOf(b.id);
        if (idxA === -1 && idxB === -1) return 0;
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }

    // 🚀 5. MEGA MENU STITCHING: Convert Flat Array -> 2D Tree Structure
    if (isMegaMenu) {
      const folders = data.megaMenuFolders || [];
      const tree: Array<any> = [];
      const folderMap: Record<string, any> = {};

      // Initialize empty folders
      folders.forEach((f: any) => {
        folderMap[f.id] = {
          label: f.label,
          id: f.id,
          type: "folder",
          children: [],
        };
      });

      // Distribute links into folders or leave them at the root
      flatItems.forEach((item) => {
        if (item.folderId && folderMap[item.folderId]) {
          folderMap[item.folderId].children.push(item);
        } else {
          tree.push(item);
        }
      });

      // Add populated folders to the main tree (ignoring empty folders so they don't break the UI)
      folders.forEach((f: any) => {
        if (folderMap[f.id].children.length > 0) {
          tree.push(folderMap[f.id]);
        }
      });

      return tree;
    }

    // If simple menu, just return the flat array
    return flatItems;
  }, [
    data.autoMenu,
    data.menuConfig,
    data.customNavLinks,
    data.menuOrder,
    data.menuType,
    data.megaMenuFolders,
    sections,
    customPages,
    username,
    pathPrefix,
  ]);
  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      const timer = setInterval(() => {
        setActiveAnnIndex((prev) => (prev + 1) % announcementsList.length);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [hasAnnouncement, data.announcementMarquee, announcementsList.length]);

  const handleNavClick = (item: any) => {
    if (isPreview) return;

    if (item.type === "page" && item.url) {
      navigate(item.url);
      setIsMenuOpen(false);
    } else if (item.type === "custom_link" && item.url) {
      setIsMenuOpen(false);
      if (item.url.startsWith("http")) window.open(item.url, "_blank");
      else if (item.url.startsWith("/"))
        navigate(`${pathPrefix}/${username}${item.url}`);
      else navigate(`${pathPrefix}/${username}/${item.url}`);
    } else if (item.type === "section") {
      if (location.pathname !== `${pathPrefix}/${username}`) {
        navigate(`${pathPrefix}/${username}`);
        setTimeout(() => {
          const element = document.getElementById(item.id);
          if (element) {
            const y =
              element.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top: y, behavior: "smooth" });
          }
        }, 300);
      } else {
        const element = document.getElementById(item.id);
        if (element) {
          const y =
            element.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }
      setIsMenuOpen(false);
    }
  };

  const toggleMobileFolder = (folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  const headerClasses = cn(
    "z-50 transition-all duration-500 ease-in-out w-full left-0",
    isPreview ? "sticky top-0 mb-[-80px]" : isSticky ? "fixed" : "absolute",
    !isScrolled && hasAnnouncement && !isPreview
      ? `top-[${announcementHeight}px]`
      : "top-0",
    variant === "floating"
      ? cn(
          "right-0 mx-auto max-w-5xl rounded-full border border-white/10 bg-neutral-900/60 backdrop-blur-md px-6 py-3 shadow-2xl w-[95%]",
          !isScrolled && hasAnnouncement && !isPreview ? "mt-4" : "mt-4"
        )
      : cn("border-b border-transparent py-4"),
    variant !== "floating" && isSticky && isScrolled
      ? "bg-neutral-950/80 backdrop-blur-md border-white/10 py-3 shadow-lg top-0"
      : "",
    !isScrolled && variant !== "floating" && "bg-transparent"
  );

  const Logo = () => (
    <div
      className="flex items-center gap-3 cursor-pointer group shrink-0"
      onClick={(e) => {
        if (isPreview) {
          e.preventDefault();
          return;
        }
        if (location.pathname !== `${pathPrefix}/${username}`)
          navigate(`${pathPrefix}/${username}`);
        else window.scrollTo({ top: 0, behavior: "smooth" });
      }}
    >
      {data.logoImage ? (
        <img
          src={data.logoImage}
          alt="Logo"
          className="w-auto object-contain transition-transform group-hover:scale-105 h-[var(--logo-h-mobile)] md:h-[var(--logo-h)]"
          style={
            {
              "--logo-h": `${data.logoHeight || 40}px`,
              "--logo-h-mobile": `${data.mobileLogoHeight || 30}px`,
            } as React.CSSProperties
          }
        />
      ) : (
        <InlineEdit
          tagName="span"
          className="text-xl md:text-2xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 block"
          text={data.logoText || "BRAND."}
          sectionId={id}
          fieldKey="logoText"
          isPreview={isPreview}
        />
      )}
    </div>
  );

  // 🚀 UPGRADED: Desktop Nav now maps Folders correctly WITH an invisible hover bridge
  const DesktopNav = () => (
    <nav className="hidden md:flex items-center gap-1">
      {menuItems.map((item) => {
        if (item.type === "folder") {
          return (
            <div key={item.id} className="relative group px-1 py-4 -my-4">
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-full hover:bg-white/5">
                {item.label}
                <ChevronDown
                  size={14}
                  className="group-hover:rotate-180 transition-transform duration-200"
                />
              </button>

              {/* 🚀 THE FIX: The Invisible Bridge (pt-3 instead of mt-2) */}
              <div className="absolute top-full left-0 pt-3 w-56 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                {/* The Actual Visual Card */}
                <div className="rounded-2xl bg-neutral-950/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
                  <div className="p-2 flex flex-col gap-1">
                    {item.children.map((child: any) => (
                      <button
                        key={child.id}
                        onClick={() => handleNavClick(child)}
                        className="text-left px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        }

        // Standard flat link
        return (
          <button
            key={item.id}
            onClick={() => handleNavClick(item)}
            className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors group rounded-full hover:bg-white/5"
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
  const SocialLinks = () => (
    <div className="hidden md:flex items-center gap-3 px-3 text-white/70 shrink-0">
      {data.socialInstagram && (
        <a
          href={data.socialInstagram}
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors"
        >
          <Instagram size={16} />
        </a>
      )}
      {data.socialTwitter && (
        <a
          href={data.socialTwitter}
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors"
        >
          <Twitter size={16} />
        </a>
      )}
      {data.socialYoutube && (
        <a
          href={data.socialYoutube}
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors"
        >
          <Youtube size={16} />
        </a>
      )}
      {data.socialImdb && (
        <a
          href={data.socialImdb}
          target="_blank"
          rel="noreferrer"
          className="hover:text-white transition-colors"
        >
          <Film size={16} />
        </a>
      )}
    </div>
  );

  const CTA = () =>
    data.ctaText && (
      <Button
        size="sm"
        asChild
        className="rounded-full bg-white text-black hover:bg-neutral-200 px-6 font-semibold h-10 hidden md:flex shrink-0"
      >
        <a
          href={data.ctaLink || "#contact"}
          onClick={(e) => {
            if (isPreview) {
              e.preventDefault();
              return;
            }
            if (data.ctaLink?.startsWith("/")) {
              e.preventDefault();
              navigate(`${pathPrefix}/${username}${data.ctaLink}`);
            }
          }}
        >
          <InlineEdit
            tagName="span"
            text={data.ctaText}
            sectionId={id}
            fieldKey="ctaText"
            isPreview={isPreview}
          />
        </a>
      </Button>
    );

  const CartButton = () => (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openCart();
      }}
      className="relative p-2 text-white/70 hover:text-white transition-colors shrink-0"
    >
      <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
      {cartCount > 0 && (
        <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 md:h-5 md:w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">
          {cartCount}
        </span>
      )}
    </button>
  );

  const AccountButton = () => (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isPreview) return;
        navigate(`${pathPrefix}/${username}/dashboard`);
      }}
      className="relative p-2 text-white/70 hover:text-white transition-colors shrink-0"
      title="My Account"
    >
      <User className="w-5 h-5 md:w-6 md:h-6" />
    </button>
  );

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
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes custom-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-custom-marquee {
          display: inline-flex;
          white-space: nowrap;
          animation: custom-marquee 20s linear infinite;
        }
        .animate-custom-marquee:hover {
          animation-play-state: paused;
        }
      `,
        }}
      />

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

      <header
        className={headerClasses}
        style={
          !isScrolled && hasAnnouncement && !isPreview && !isSticky
            ? { top: `${announcementHeight}px` }
            : {}
        }
      >
        <div
          className={cn(
            "container mx-auto h-full flex items-center",
            variant === "floating" ? "px-0" : "px-6"
          )}
        >
          {variant === "transparent" && (
            <div className="w-full flex items-center justify-between">
              <Logo />
              <div className="flex items-center gap-2 md:gap-4">
                <DesktopNav />
                {hasSocial && (
                  <div className="border-l border-white/10 pl-1">
                    <SocialLinks />
                  </div>
                )}
                <AccountButton />
                <CartButton />
                <div className="pl-4 ml-2 border-l border-white/10 hidden md:block">
                  <CTA />
                </div>
                <button
                  className="md:hidden p-2 text-white"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu />
                </button>
              </div>
            </div>
          )}

          {variant === "centered" && (
            <div className="w-full grid grid-cols-3 items-center">
              <div className="justify-self-start flex items-center">
                <DesktopNav />
                {hasSocial && (
                  <div className="hidden md:block border-l border-white/10 pl-1 ml-4">
                    <SocialLinks />
                  </div>
                )}
                <button
                  className="md:hidden p-2 text-white"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu />
                </button>
              </div>
              <div className="justify-self-center">
                <Logo />
              </div>
              <div className="justify-self-end flex items-center gap-2 md:gap-4">
                <AccountButton />
                <CartButton />
                <div className="hidden md:block">
                  <CTA />
                </div>
              </div>
            </div>
          )}

          {variant === "floating" && (
            <div className="w-full flex items-center justify-between">
              <Logo />
              <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center">
                <DesktopNav />
              </div>
              <div className="flex items-center gap-1 md:gap-3">
                {hasSocial && <SocialLinks />}
                <AccountButton />
                <CartButton />
                <div className="hidden md:block">
                  <CTA />
                </div>
                <button
                  className="md:hidden p-2 text-white"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 🚀 UPGRADED: MOBILE MENU WITH ACCORDIONS */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-neutral-950 md:hidden flex flex-col items-center justify-start transition-all duration-500 ease-in-out overflow-y-auto custom-scrollbar",
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        <button
          className="absolute top-6 right-6 p-2 text-white/50 hover:text-white z-10"
          onClick={() => setIsMenuOpen(false)}
        >
          <X size={32} />
        </button>

        <div className="flex flex-col items-center w-full px-8 pt-24 pb-20 gap-8 min-h-full">
          {menuItems.map((item, idx) => {
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
                      "flex items-center gap-2 text-3xl font-bold text-white/90 hover:text-white transition-all duration-300 transform",
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
                        isExpanded && "rotate-180 text-primary"
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
                        className="text-xl font-medium text-white/60 hover:text-white transition-colors"
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
                  "text-3xl font-bold text-white/90 hover:text-white transition-all duration-300 transform",
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

          {hasSocial && (
            <div
              className={cn(
                "flex items-center justify-center gap-6 mt-8 pt-8 border-t border-white/10 w-full max-w-[200px] transition-all duration-500",
                isMenuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              )}
              style={{ transitionDelay: `${menuItems.length * 50 + 50}ms` }}
            >
              {data.socialInstagram && (
                <a
                  href={data.socialInstagram}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 hover:text-white"
                >
                  <Instagram size={24} />
                </a>
              )}
              {data.socialTwitter && (
                <a
                  href={data.socialTwitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 hover:text-white"
                >
                  <Twitter size={24} />
                </a>
              )}
              {data.socialYoutube && (
                <a
                  href={data.socialYoutube}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 hover:text-white"
                >
                  <Youtube size={24} />
                </a>
              )}
              {data.socialImdb && (
                <a
                  href={data.socialImdb}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white/70 hover:text-white"
                >
                  <Film size={24} />
                </a>
              )}
            </div>
          )}

          {data.ctaText && (
            <div
              className={cn(
                "mt-4 w-full max-w-xs transition-all duration-500",
                isMenuOpen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              )}
              style={{ transitionDelay: `${menuItems.length * 50 + 100}ms` }}
            >
              <Button
                size="lg"
                className="w-full rounded-full bg-white text-black hover:bg-neutral-200 text-lg h-14"
                asChild
              >
                <a
                  href={data.ctaLink || "#contact"}
                  onClick={(e) => {
                    if (isPreview) {
                      e.preventDefault();
                      return;
                    }
                    if (data.ctaLink?.startsWith("/")) {
                      e.preventDefault();
                      navigate(`${pathPrefix}/${username}${data.ctaLink}`);
                      setIsMenuOpen(false);
                    }
                  }}
                >
                  <InlineEdit
                    tagName="span"
                    text={data.ctaText}
                    sectionId={id}
                    fieldKey="ctaText"
                    isPreview={isPreview}
                  />
                  <ArrowRight className="ml-2 w-5 h-5 inline-block" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;
