import React from "react";

// The shape of the data passed to each block
// (This matches your 'PortfolioSection' data structure)
export interface BlockProps {
  data: any;
  actorId?: string; // Some blocks (like Services) might need the ID to fetch more data
  allSections?: any[]; // <-- NEW: Pass all sections so Header can read them
  isPreview?: boolean; // <-- Add this prop
  id: string;
  isVisible: boolean;
  settings: Record<string, any>;
}

// The contract: Every theme MUST export these components
export interface PortfolioThemeDefinition {
  Header: React.FC<BlockProps>;
  Hero: React.FC<BlockProps>;
  About: React.FC<BlockProps>;
  Gallery: React.FC<BlockProps>;
  ServicesShowcase: React.FC<BlockProps>; // <-- Add this
  Contact: React.FC<BlockProps>;
  Stats: React.FC<BlockProps>;
  Reviews: React.FC<BlockProps>;
  ImageSlider: React.FC<BlockProps>; // <-- Add
  VideoSlider: React.FC<BlockProps>; // <-- Add
  Team: React.FC<BlockProps>;
  Map: React.FC<BlockProps>;
  Pricing: React.FC<BlockProps>;
  Shop: React.FC<BlockProps>;
  LeadForm: React.FC<BlockProps>;
  DynamicStore: React.FC<BlockProps>;
  Html: React.FC<BlockProps>;
  schemas?: Record<string, any[]>;
  /** Components for section types added after this theme was written. */
  [componentKey: string]: any;
}
