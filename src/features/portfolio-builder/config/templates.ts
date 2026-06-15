import { PortfolioSection } from "../types/portfolio";

export interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  sections: PortfolioSection[];
}

export const PORTFOLIO_TEMPLATES: PortfolioTemplate[] = [
  // ---------------------------------------------------------
  // 1. ACTOR & TALENT
  // ---------------------------------------------------------
  {
    id: "actor-standard",
    name: "Actor Standard",
    description:
      "Classic layout for film & TV actors. Focuses on headshots and credits.",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "My Name" },
      },
      {
        id: "hero",
        type: "hero",
        isVisible: true,
        data: {
          headline: "Actor & Performer",
          subheadline: "Based in LA & NY",
        },
      },
      {
        id: "about",
        type: "about",
        isVisible: true,
        data: { title: "Biography" },
      },
      {
        id: "gallery",
        type: "gallery",
        isVisible: true,
        data: { title: "Headshots" },
      },
      {
        id: "video_slider",
        type: "video_slider",
        isVisible: true,
        data: { title: "Showreel" },
      },
      {
        id: "contact",
        type: "contact",
        isVisible: true,
        data: { title: "Contact Representation" },
      },
    ],
  },

  // ---------------------------------------------------------
  // 2. VOICEOVER & AUDIO
  // ---------------------------------------------------------
  {
    id: "voiceover-pro",
    name: "Voiceover Pro",
    description:
      "Audio-first layout. Perfect for voice actors, narrators, and podcasters.",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "VO Artist" },
      },
      {
        id: "hero",
        type: "hero",
        isVisible: true,
        data: {
          headline: "The Voice You Need",
          subheadline: "Commercial • Animation • Narration",
        },
      },
      {
        id: "services",
        type: "services_showcase",
        isVisible: true,
        data: { title: "Demos & Rates", showDemos: true },
      },
      {
        id: "about",
        type: "about",
        isVisible: true,
        data: {
          title: "Studio Specs",
          features: ["Neumann U87", "SourceConnect", "WhisperRoom"],
        },
      },
      {
        id: "reviews",
        type: "reviews",
        isVisible: true,
        data: { title: "Happy Clients" },
      },
      {
        id: "lead_form",
        type: "lead_form",
        isVisible: true,
        data: { title: "Request a Quote", buttonText: "Book Session" },
      },
    ],
  },

  // ---------------------------------------------------------
  // 3. INFLUENCER & CREATOR
  // ---------------------------------------------------------
  {
    id: "creator-shop",
    name: "Creator & Shop",
    description:
      "Sales-focused layout for influencers selling merch, LUTs, or digital products.",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "Creator Brand" },
      },
      {
        id: "hero",
        type: "hero",
        isVisible: true,
        data: {
          headline: "Digital Products & Merch",
          subheadline: "Presets, Guides, and Apparel",
        },
      },
      {
        id: "shop",
        type: "shop",
        isVisible: true,
        data: { title: "Featured Drops", variant: "grid" },
      },
      {
        id: "stats",
        type: "stats",
        isVisible: true,
        data: {
          customStats: [
            { label: "Followers", value: "100K+" },
            { label: "Downloads", value: "50K+" },
          ],
        },
      },
      {
        id: "video_slider",
        type: "video_slider",
        isVisible: true,
        data: { title: "Latest Vlogs" },
      },
      {
        id: "contact",
        type: "contact",
        isVisible: true,
        data: { title: "Brand Partnerships" },
      },
    ],
  },

  // ---------------------------------------------------------
  // 4. COACH & CONSULTANT
  // ---------------------------------------------------------
  {
    id: "coach-consultant",
    name: "Coach & Consultant",
    description:
      "High-converting funnel for coaches. Showcases authority, testimonials, and books calls.",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "Growth Consulting" },
      },
      {
        id: "hero",
        type: "hero",
        isVisible: true,
        data: {
          headline: "Scale Your Business Faster",
          subheadline: "Actionable strategies for modern entrepreneurs.",
        },
      },
      {
        id: "stats",
        type: "stats",
        isVisible: true,
        data: {
          title: "By The Numbers",
          customStats: [
            { label: "Clients Scaled", value: "250+" },
            { label: "Revenue Generated", value: "$5M+" },
          ],
        },
      },
      {
        id: "services",
        type: "services_showcase",
        isVisible: true,
        data: { title: "How I Can Help" },
      },
      {
        id: "reviews",
        type: "reviews",
        isVisible: true,
        data: { title: "Client Success Stories" },
      },
      {
        id: "shop",
        type: "shop",
        isVisible: true,
        data: { title: "My Bestselling Book", variant: "spotlight" },
      },
      {
        id: "lead_form",
        type: "lead_form",
        isVisible: true,
        data: { title: "Book a Discovery Call", buttonText: "Apply Now" },
      },
    ],
  },

  // ---------------------------------------------------------
  // 5. CREATIVE AGENCY / FREELANCER
  // ---------------------------------------------------------
  {
    id: "creative-agency",
    name: "Creative Agency",
    description:
      "Sleek portfolio for designers, marketing agencies, and freelance developers.",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "Studio Studio" },
      },
      {
        id: "hero",
        type: "hero",
        isVisible: true,
        data: {
          headline: "We Build Digital Experiences",
          subheadline: "Branding, Web Design, and Marketing.",
        },
      },
      {
        id: "gallery",
        type: "gallery",
        isVisible: true,
        data: { title: "Selected Works" },
      },
      {
        id: "services",
        type: "services_showcase",
        isVisible: true,
        data: { title: "Our Expertise" },
      },
      {
        id: "reviews",
        type: "reviews",
        isVisible: true,
        data: { title: "What They Say" },
      },
      {
        id: "lead_form",
        type: "lead_form",
        isVisible: true,
        data: { title: "Start a Project", buttonText: "Get an Estimate" },
      },
    ],
  },

  // ---------------------------------------------------------
  // 6. E-COMMERCE MINI-STORE
  // ---------------------------------------------------------
  {
    id: "ecommerce-brand",
    name: "E-Commerce Brand",
    description:
      "Direct-to-consumer layout. Perfect for dropshippers or single-product brands.",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "BrandName." },
      },
      {
        id: "shop_hero",
        type: "shop",
        isVisible: true,
        data: { title: "The Ultimate Everyday Bag", variant: "spotlight" },
      },
      {
        id: "gallery",
        type: "gallery",
        isVisible: true,
        data: { title: "In The Wild" },
      },
      {
        id: "reviews",
        type: "reviews",
        isVisible: true,
        data: { title: "Rated 4.9/5 by 10,000+ Users" },
      },
      {
        id: "shop_catalog",
        type: "shop",
        isVisible: true,
        data: { title: "More Accessories", variant: "carousel" },
      },
      {
        id: "lead_form",
        type: "lead_form",
        isVisible: true,
        data: {
          title: "Join the VIP Club",
          subheadline: "Get 15% off your first order.",
          buttonText: "Subscribe",
        },
      },
    ],
  },

  // ---------------------------------------------------------
  // 7. PHOTOGRAPHER PORTFOLIO
  // ---------------------------------------------------------
  {
    id: "photographer",
    name: "Photographer",
    description:
      "Minimalist, visual-first layout for photographers to showcase their galleries.",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "Lens & Light" },
      },
      {
        id: "gallery_main",
        type: "gallery",
        isVisible: true,
        data: { title: "" },
      }, // Blank title for seamless hero gallery
      {
        id: "services",
        type: "services_showcase",
        isVisible: true,
        data: { title: "Packages & Sessions" },
      },
      {
        id: "about",
        type: "about",
        isVisible: true,
        data: { title: "Behind the Lens" },
      },
      {
        id: "gallery_secondary",
        type: "gallery",
        isVisible: true,
        data: { title: "Publications" },
      },
      {
        id: "contact",
        type: "contact",
        isVisible: true,
        data: { title: "Book a Shoot" },
      },
    ],
  },

  // ---------------------------------------------------------
  // 8. LOCAL BUSINESS (SERVICE)
  // ---------------------------------------------------------
  {
    id: "local-business",
    name: "Local Business",
    description:
      "Trust-building template for local services (plumbers, salons, landscaping, etc.)",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "City Services" },
      },
      {
        id: "hero",
        type: "hero",
        isVisible: true,
        data: {
          headline: "Top Rated Local Experts",
          subheadline: "Fast, reliable, and affordable.",
        },
      },
      {
        id: "services",
        type: "services_showcase",
        isVisible: true,
        data: { title: "What We Do" },
      },
      {
        id: "reviews",
        type: "reviews",
        isVisible: true,
        data: { title: "Community Reviews" },
      },
      {
        id: "gallery",
        type: "gallery",
        isVisible: true,
        data: { title: "Before & After" },
      },
      {
        id: "lead_form",
        type: "lead_form",
        isVisible: true,
        data: { title: "Get a Free Quote", buttonText: "Submit Request" },
      },
    ],
  },

  // ---------------------------------------------------------
  // 9. FILMMAKER & DIRECTOR
  // ---------------------------------------------------------
  {
    id: "filmmaker",
    name: "Filmmaker / Director",
    description:
      "Cinematic layout emphasizing high-quality video content and filmography.",
    sections: [
      {
        id: "header",
        type: "header",
        isVisible: true,
        data: { logoText: "Director Name" },
      },
      {
        id: "hero",
        type: "hero",
        isVisible: true,
        data: {
          headline: "Award-Winning Director",
          subheadline: "Commercials • Music Videos • Narrative",
        },
      },
      {
        id: "video_slider",
        type: "video_slider",
        isVisible: true,
        data: { title: "Director's Reel" },
      },
      {
        id: "gallery",
        type: "gallery",
        isVisible: true,
        data: { title: "Behind The Scenes" },
      },
      {
        id: "about",
        type: "about",
        isVisible: true,
        data: { title: "Biography & Press" },
      },
      {
        id: "contact",
        type: "contact",
        isVisible: true,
        data: { title: "Get in Touch" },
      },
    ],
  },
];
