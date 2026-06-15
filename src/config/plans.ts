// src/lib/plans.ts

export type PlanTier = "starter" | "ecommerce" | "pro";

// 1. Define the shape of the features explicitly
export interface PlanFeatures {
  siteSlots: any;
  maxBlocksPerSite: number;
  canConnectDomain: boolean;
  hasMegaMenu: boolean; // 🚀 ADD THIS FLAG
  // This is the fix: Allow specific array OR 'all'
  allowedThemes: string[] | "all";
  allowedSectionTypes: string[] | "all";
  modules: {
    shop: boolean;
    appointments: boolean;
    orders_leads: boolean;
  };
  storageLimitMB: number;
}

// 2. Apply this type to the Record
export const PLAN_LIMITS: Record<
  PlanTier,
  { label: string; features: PlanFeatures }
> = {
  starter: {
    label: "Starter",
    features: {
      maxBlocksPerSite: 8,
      canConnectDomain: false,
      hasMegaMenu: false,
      allowedThemes: ["modern", "minimal"],
      allowedSectionTypes: [
        "header",
        "hero",
        "about",
        "gallery",
        "contact",
        "footer",
      ],
      modules: {
        shop: false,
        appointments: false,
        orders_leads: false,
      },
      storageLimitMB: 100,
      siteSlots: undefined,
    },
  },
  ecommerce: {
    label: "eCommerce",
    features: {
      maxBlocksPerSite: 20,
      canConnectDomain: true,
      hasMegaMenu: true,
      allowedThemes: ["modern", "minimal", "storefront", "showcase"],
      allowedSectionTypes: [
        "header",
        "hero",
        "about",
        "gallery",
        "contact",
        "footer",
        "shop",
        "reviews",
      ],
      modules: {
        shop: true,
        appointments: false,
        orders_leads: true,
      },
      storageLimitMB: 500,
      siteSlots: undefined,
    },
  },
  pro: {
    label: "Pro",
    features: {
      maxBlocksPerSite: 999,
      canConnectDomain: true,
      hasMegaMenu: true,
      allowedThemes: "all", // Now valid because of the interface
      allowedSectionTypes: "all",
      modules: {
        shop: true,
        appointments: true,
        orders_leads: true,
      },
      storageLimitMB: 2000,
      siteSlots: undefined,
    },
  },
};
