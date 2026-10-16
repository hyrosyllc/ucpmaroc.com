import type { SectionType } from "../types/portfolio";
import type { ContentSchema } from "./schema";

export type SectionCategory =
  | "structure"
  | "content"
  | "media"
  | "conversion"
  | "commerce"
  | "advanced";

export interface SectionDefinition {
  type: SectionType;
  label: string;
  /** Key of the component on a theme definition (see `PortfolioThemeDefinition`). */
  componentKey: string;
  category: SectionCategory;
  /** Plan module that must be enabled to add this section. */
  module?: "shop" | "appointments";
  /** Content applied when the section is first added. */
  defaultData: Record<string, any>;
  /** Design settings applied when the section is first added. */
  defaultSettings?: Record<string, any>;
  /** Declarative content fields; sections with a schema need no hand-written editor. */
  contentSchema?: ContentSchema;
}

export const SECTION_DEFINITIONS: Record<SectionType, SectionDefinition> = {
  header: { type: "header", label: "Header", componentKey: "Header", category: "structure", defaultData: { logoText: "My Portfolio", variant: "transparent", isSticky: true, autoMenu: true } },
  hero: { type: "hero", label: "Hero", componentKey: "Hero", category: "structure", defaultData: {} },
  about: { type: "about", label: "About", componentKey: "About", category: "content", defaultData: {} },
  shop: { type: "shop", label: "Quick Shop", componentKey: "Shop", category: "commerce", module: "shop", defaultData: {} },
  dynamic_store: { type: "dynamic_store", label: "E-commerce", componentKey: "DynamicStore", category: "commerce", module: "shop", defaultData: {} },
  gallery: { type: "gallery", label: "Gallery", componentKey: "Gallery", category: "media", defaultData: {} },
  image_slider: { type: "image_slider", label: "Image Slider", componentKey: "ImageSlider", category: "media", defaultData: {} },
  video_slider: { type: "video_slider", label: "Video Slider", componentKey: "VideoSlider", category: "media", defaultData: {} },
  contact: { type: "contact", label: "Contact Form", componentKey: "Contact", category: "conversion", defaultData: {} },
  lead_form: { type: "lead_form", label: "Lead Form", componentKey: "LeadForm", category: "conversion", defaultData: {} },
  map: { type: "map", label: "Map", componentKey: "Map", category: "content", defaultData: {} },
  team: { type: "team", label: "Team", componentKey: "Team", category: "content", defaultData: {} },
  pricing: { type: "pricing", label: "Pricing", componentKey: "Pricing", category: "conversion", defaultData: {} },
  stats: { type: "stats", label: "Statistics", componentKey: "Stats", category: "content", defaultData: {} },
  reviews: { type: "reviews", label: "Reviews", componentKey: "Reviews", category: "content", defaultData: {} },
  services_showcase: { type: "services_showcase", label: "Services", componentKey: "ServicesShowcase", category: "content", defaultData: {} },
  html: { type: "html", label: "Custom HTML", componentKey: "Html", category: "advanced", defaultData: {} },
  faq: {
    type: "faq",
    label: "FAQ",
    componentKey: "Faq",
    category: "content",
    defaultData: {
      title: "Frequently asked questions",
      subtitle: "",
      allowMultiple: false,
      firstOpen: true,
      items: [
        { question: "What is your question?", answer: "Write the answer here.", category: "" },
      ],
    },
    contentSchema: [
      { id: "title", label: "Title", type: "text" },
      { id: "subtitle", label: "Subtitle", type: "text" },
      { id: "allowMultiple", label: "Allow several answers open", type: "toggle" },
      { id: "firstOpen", label: "Open first answer by default", type: "toggle" },
      {
        id: "items",
        label: "Question",
        type: "repeater",
        itemTitleKey: "question",
        itemFields: [
          { id: "question", label: "Question", type: "text" },
          { id: "answer", label: "Answer", type: "textarea" },
          { id: "category", label: "Category (optional)", type: "text" },
        ],
      },
    ],
  },
  features: {
    type: "features",
    label: "Features Grid",
    componentKey: "Features",
    category: "content",
    defaultData: {
      title: "Why choose us",
      subtitle: "",
      items: [
        { icon: "✨", title: "Feature one", description: "Describe the benefit." },
        { icon: "⚡", title: "Feature two", description: "Describe the benefit." },
        { icon: "🔒", title: "Feature three", description: "Describe the benefit." },
      ],
    },
    contentSchema: [
      { id: "title", label: "Title", type: "text" },
      { id: "subtitle", label: "Subtitle", type: "text" },
      {
        id: "items",
        label: "Feature",
        type: "repeater",
        itemTitleKey: "title",
        itemFields: [
          { id: "icon", label: "Icon (emoji)", type: "text" },
          { id: "title", label: "Title", type: "text" },
          { id: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  steps: {
    type: "steps",
    label: "Steps / Process",
    componentKey: "Steps",
    category: "content",
    defaultData: {
      title: "How it works",
      subtitle: "",
      items: [
        { title: "Get in touch", description: "Tell us what you need." },
        { title: "We plan", description: "We prepare a clear proposal." },
        { title: "We deliver", description: "You receive the finished work." },
      ],
    },
    contentSchema: [
      { id: "title", label: "Title", type: "text" },
      { id: "subtitle", label: "Subtitle", type: "text" },
      {
        id: "items",
        label: "Step",
        type: "repeater",
        itemTitleKey: "title",
        itemFields: [
          { id: "title", label: "Title", type: "text" },
          { id: "description", label: "Description", type: "textarea" },
        ],
      },
    ],
  },
  cta: {
    type: "cta",
    label: "Call to Action",
    componentKey: "Cta",
    category: "conversion",
    defaultData: {
      headline: "Ready to get started?",
      text: "",
      buttonText: "Contact us",
      buttonLink: "#contact",
      secondaryText: "",
      secondaryLink: "",
    },
    contentSchema: [
      { id: "headline", label: "Headline", type: "text" },
      { id: "text", label: "Text", type: "textarea" },
      { id: "buttonText", label: "Button text", type: "text" },
      { id: "buttonLink", label: "Button link", type: "text", help: "Use #section, /path, or https://…" },
      { id: "secondaryText", label: "Second button text", type: "text" },
      { id: "secondaryLink", label: "Second button link", type: "text" },
    ],
  },
  rich_text: {
    type: "rich_text",
    label: "Rich Text",
    componentKey: "RichText",
    category: "content",
    defaultData: { title: "", subtitle: "", align: "center", content: "# Heading\n\nWrite your text here.\n\n- First point\n- Second point" },
    contentSchema: [
      { id: "title", label: "Title", type: "text" },
      { id: "subtitle", label: "Subtitle", type: "text" },
      {
        id: "align",
        label: "Heading alignment",
        type: "select",
        options: [
          { value: "center", label: "Center" },
          { value: "left", label: "Left" },
        ],
      },
      { id: "content", label: "Content", type: "richtext", help: "Start a line with # for a heading or - for a list. Blank line starts a new paragraph." },
    ],
  },
  logo_cloud: {
    type: "logo_cloud",
    label: "Logo Cloud",
    componentKey: "LogoCloud",
    category: "content",
    defaultData: { title: "Trusted by", subtitle: "", grayscale: true, logos: [] },
    contentSchema: [
      { id: "title", label: "Title", type: "text" },
      { id: "subtitle", label: "Subtitle", type: "text" },
      { id: "grayscale", label: "Grayscale logos", type: "toggle", defaultValue: true },
      {
        id: "logos",
        label: "Logo",
        type: "repeater",
        itemTitleKey: "name",
        itemFields: [
          { id: "name", label: "Name", type: "text" },
          { id: "image", label: "Image URL", type: "image" },
        ],
      },
    ],
  },
  testimonials: {
    type: "testimonials",
    label: "Testimonials",
    componentKey: "Testimonials",
    category: "content",
    defaultData: {
      title: "What clients say",
      subtitle: "",
      items: [{ quote: "Write a client quote here.", name: "Client name", role: "Role, Company", avatar: "" }],
    },
    contentSchema: [
      { id: "title", label: "Title", type: "text" },
      { id: "subtitle", label: "Subtitle", type: "text" },
      {
        id: "items",
        label: "Testimonial",
        type: "repeater",
        itemTitleKey: "name",
        itemFields: [
          { id: "quote", label: "Quote", type: "textarea" },
          { id: "name", label: "Name", type: "text" },
          { id: "role", label: "Role", type: "text" },
          { id: "avatar", label: "Avatar URL", type: "image" },
        ],
      },
    ],
  },
  booking: {
    type: "booking",
    label: "Booking Calendar",
    componentKey: "Booking",
    category: "conversion",
    module: "appointments",
    defaultData: { title: "Book an appointment", subtitle: "", serviceId: "" },
    contentSchema: [
      { id: "title", label: "Title", type: "text" },
      { id: "subtitle", label: "Subtitle", type: "text" },
      { id: "serviceId", label: "Preselected service ID (optional)", type: "text", help: "Manage services under Bookings in the dashboard." },
    ],
  },
};

export const SECTION_LIST: SectionDefinition[] = Object.values(SECTION_DEFINITIONS);

export function getSectionDefinition(type: string): SectionDefinition | undefined {
  return (SECTION_DEFINITIONS as Record<string, SectionDefinition>)[type];
}

/** Builds the initial `data` for a newly added section. */
export function createSectionData(type: SectionType): Record<string, any> {
  const def = SECTION_DEFINITIONS[type];
  return { title: def.label, ...structuredClone(def.defaultData) };
}
