import type { MarketplaceServiceId } from '@/features/talent-marketplace/serviceCatalog';

export type QuotePricingMode = 'instant' | 'quote_only';

export interface QuoteRequirements {
  projectDescription: string;
  estimatedDuration: string;
  estimatedWordCount: number;
  scriptFormat: string;
  targetAudience: string;
  videoType: string;
  footageChoice: string;
}

export interface QuoteServiceDefinition {
  serviceId: MarketplaceServiceId;
  pricingMode: QuotePricingMode;
  title: string;
  description: string;
  requiredFields: Array<keyof QuoteRequirements>;
  getSummary: (requirements: QuoteRequirements) => string[];
}
