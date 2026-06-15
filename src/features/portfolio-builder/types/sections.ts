// src/types/sections.ts

// ==========================================
// 1. THE BASE CONTRACT (Shared by all)
// ==========================================
export interface BaseSectionProps<TSettings = Record<string, any>> {
  id: string;
  isVisible: boolean;
  isPreview?: boolean; // Tells the component if it's in the builder!
  settings: TSettings; // Developer's custom schema data
}

// ==========================================
// 2. SPECIFIC SECTION CONTRACTS
// ==========================================

// --- HEADER SECTION ---
export interface HeaderCoreData {
  logoText?: string;
  logoImage?: string;
  logoHeight?: number;
  mobileLogoHeight?: number;
  variant?: "transparent" | "centered" | "floating";
  isSticky?: boolean;
  showAnnouncement?: boolean;
  announcements?: Array<{ id: string; text: string; link?: string }>;
  announcementBgColor?: string;
  announcementTextColor?: string;
  announcementMarquee?: boolean;
  autoMenu?: boolean;
  menuType?: "simple" | "mega";
  megaMenuFolders?: Array<{ id: string; label: string }>;
  menuConfig?: Record<
    string,
    { label?: string; visible?: boolean; folderId?: string | null }
  >;
  customNavLinks?: Array<{
    id: string;
    label: string;
    url: string;
    visible?: boolean;
    folderId?: string | null;
  }>;
  socialInstagram?: string;
  socialTwitter?: string;
  socialYoutube?: string;
  socialImdb?: string;
  ctaText?: string;
  ctaLink?: string;
}
export type HeaderSectionProps = BaseSectionProps & { data: HeaderCoreData };

// --- HERO SECTION ---
export interface HeroCoreData {
  layout?: "center" | "split-left" | "split-right" | "bottom";
  alignment?: "left" | "center" | "right";
  label?: string;
  headline?: string;
  animateHeadline?: boolean;
  subheadline?: string;
  showTrustBadge?: boolean;
  trustText?: string;
  variant?: "static" | "video" | "color";
  videoUrl?: string;
  mobileVideoUrl?: string;
  mobileVideoFit?: "cover" | "fill" | "contain";
  colorType?: "solid" | "gradient" | "mesh";
  backgroundColor?: string;
  gradientColor1?: string;
  gradientColor2?: string;
  backgroundImage?: string;
  mobileBackgroundImage?: string;
  overlayOpacity?: number;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}
export type HeroSectionProps = BaseSectionProps & { data: HeroCoreData };

// --- 🚀 ABOUT SECTION (Replaces legacy Bio) ---
export interface AboutCoreData {
  variant?: "simple" | "split" | "profile";
  layout?: "left" | "right";
  label?: string;
  title?: string;
  content?: string;
  image?: string; // Video or Image URL
  features?: string[];
  stats?: Array<{ label: string; value: string }>;
  ctaText?: string;
  ctaLink?: string;
}
export type AboutSectionProps = BaseSectionProps & { data: AboutCoreData };

// --- 🚀 GALLERY SECTION ---
export interface GalleryCoreData {
  title?: string;
  variant?: "masonry" | "carousel" | "grid";
  aspectRatio?: "square" | "portrait" | "landscape";
  gridColumns?: number;
  images?: Array<{ url: string; type?: string }>;
}
export type GallerySectionProps = BaseSectionProps & { data: GalleryCoreData };

// --- 🚀 IMAGE SLIDER SECTION ---
export interface ImageSliderCoreData {
  title?: string;
  variant?: "standard" | "cinematic" | "cards";
  height?: "medium" | "large" | "full";
  interval?: number;
  images?: Array<{ url: string; caption?: string }>;
}
export type ImageSliderSectionProps = BaseSectionProps & {
  data: ImageSliderCoreData;
};

// --- 🚀 VIDEO SLIDER SECTION ---
export interface VideoSliderCoreData {
  title?: string;
  variant?: "cinema" | "carousel" | "grid";
  height?: "medium" | "large" | "full";
  gridColumns?: number;
  videos?: Array<{ url: string; title?: string; caption?: string }>;
}
export type VideoSliderSectionProps = BaseSectionProps & {
  data: VideoSliderCoreData;
};

// --- 🚀 TEAM SECTION ---
export interface TeamCoreData {
  title?: string;
  variant?: "grid" | "spotlight" | "carousel";
  members?: Array<{
    name: string;
    role: string;
    bio?: string;
    image?: string;
    linkedin?: string;
    instagram?: string;
  }>;
}
export type TeamSectionProps = BaseSectionProps & { data: TeamCoreData };

// --- 🚀 MAP SECTION ---
export interface MapCoreData {
  title?: string;
  variant?: "standard" | "dark" | "card";
  height?: "small" | "medium" | "large";
  mapUrl?: string; // Embed Src
  directionUrl?: string;
  address?: string;
}
export type MapSectionProps = BaseSectionProps & { data: MapCoreData };

// --- 🚀 PRICING SECTION ---
export interface PricingCoreData {
  title?: string;
  variant?: "cards" | "slider" | "list";
  plans?: Array<{
    name: string;
    price: string;
    unit?: string;
    features?: string;
    cta?: string;
    buttonUrl?: string;
    isPopular?: boolean;
  }>;
}
export type PricingSectionProps = BaseSectionProps & { data: PricingCoreData };

// --- 🚀 LEAD FORM SECTION ---
export interface LeadFormCoreData {
  title?: string;
  subheadline?: string;
  buttonText?: string;
  variant?: "centered" | "split" | "minimal";
  image?: string;
  fields?: Array<{
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
    width?: "half" | "full";
  }>;
}
export type LeadFormSectionProps = BaseSectionProps & {
  data: LeadFormCoreData;
};

// --- 🚀 STATS SECTION ---
export interface StatsCoreData {
  showProjects?: boolean;
  showExperience?: boolean;
  customStats?: Array<{ label: string; value: string }>;
}
export type StatsSectionProps = BaseSectionProps & { data: StatsCoreData };

// --- 🚀 REVIEWS SECTION ---
export interface ReviewsCoreData {
  title?: string;
  autoScroll?: boolean;
}
export type ReviewsSectionProps = BaseSectionProps & { data: ReviewsCoreData };

// --- SERVICES SHOWCASE SECTION ---
export interface ServicesCoreData {
  title?: string;
  showRates?: boolean;
  showDemos?: boolean;
  ctaText?: string;
  ctaLink?: string;
}
export type ServicesSectionProps = BaseSectionProps & {
  data: ServicesCoreData;
};

// --- CONTACT SECTION ---
export interface ContactCoreData {
  variant?: "minimal" | "split" | "card";
  title?: string;
  subheadline?: string;
  email?: string;
  ctaText?: string;
  ctaLink?: string;
  phone?: string;
  whatsapp?: string;
  image?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  website?: string;
}
export type ContactSectionProps = BaseSectionProps & { data: ContactCoreData };

// --- QUICK SHOP (LEGACY MANUAL PRODUCTS) ---
export interface ShopCoreData {
  title?: string;
  variant?: "grid" | "carousel" | "spotlight";
  products?: Array<{
    title: string;
    price: string;
    stock?: string;
    description?: string;
    actionType?: "whatsapp" | "form_order" | "link";
    whatsappNumber?: string;
    checkoutUrl?: string;
    buttonText?: string;
    image?: string;
    images?: string[];
    variants?: Array<{ name: string; options: string }>;
  }>;
}
export type ShopSectionProps = BaseSectionProps & { data: ShopCoreData };

// --- DYNAMIC STORE (DATABASE PRODUCTS) ---
export interface DynamicStoreCoreData {
  title?: string;
  subtitle?: string;
  variant?: "grid" | "carousel" | "spotlight";
  maxProductsToShow?: number;
  selectedProductIds?: string[];
}
export type DynamicStoreSectionProps = BaseSectionProps & {
  data: DynamicStoreCoreData;
};

// --- CUSTOM HTML SECTION ---
export interface HtmlCoreData {
  code?: string;
}
export type HtmlSectionProps = BaseSectionProps & { data: HtmlCoreData };
