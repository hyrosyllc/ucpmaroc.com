// src/themes/modern/index.tsx

import React, { lazy } from "react";
import { PortfolioThemeDefinition } from "../types";

// 🚀 AAA+ LAZY LOADING: Replaced static imports with dynamic imports.
// Webpack will now split these into tiny, individual JS chunks.
const Header = lazy(() => import("./Header"));
const Hero = lazy(() => import("./Hero"));
const About = lazy(() => import("./About"));
const Gallery = lazy(() => import("./Gallery"));
const Contact = lazy(() => import("./Contact"));
const Reviews = lazy(() => import("./Reviews"));
const ImageSlider = lazy(() => import("./ImageSlider"));
const VideoSlider = lazy(() => import("./VideoSlider"));
const ServicesShowcase = lazy(() => import("./ServicesShowcase"));
const Team = lazy(() => import("./Team"));
const Map = lazy(() => import("./Map"));
const Pricing = lazy(() => import("./Pricing"));
const Shop = lazy(() => import("./Shop"));
const LeadForm = lazy(() => import("./LeadForm"));
const Html = lazy(() => import("./Html"));

// Handle named exports dynamically
const DynamicStore = lazy(() =>
  import("./DynamicStore").then((module) => ({ default: module.DynamicStore }))
);

// Temporary Placeholders (Kept inline because they are tiny and don't need splitting)
const Stats = () => (
  <div className="py-20 text-center bg-muted">Stats Section (Coming Soon)</div>
);
const Demos = () => (
  <div className="py-20 text-center">Demos Section (Coming Soon)</div>
);

export const ModernBrightTheme: PortfolioThemeDefinition = {
  Header,
  Hero,
  About,
  Gallery,
  ServicesShowcase,
  Contact,
  Stats,
  Reviews,
  ImageSlider,
  VideoSlider,
  Team,
  Map,
  Pricing,
  Shop,
  LeadForm,
  DynamicStore,
  Html,
  schemas: {
    Header: [
      {
        id: "variant",
        type: "select",
        label: "Header Variant",
        options: [
          { value: "transparent", label: "Transparent (Standard)" },
          { value: "centered", label: "Editorial (Centered Logo)" },
          { value: "floating", label: "Floating Island (Pill Shape)" },
        ],
        defaultValue: "transparent",
      },
      {
        id: "isSticky",
        type: "toggle",
        label: "Sticky Header",
        defaultValue: true,
      },
    ],
    Hero: [
      {
        id: "layout",
        type: "select",
        label: "Hero Structure",
        options: [
          { value: "center", label: "Immersive Center" },
          { value: "split-left", label: "Split (Text Left)" },
          { value: "split-right", label: "Split (Text Right)" },
          { value: "bottom", label: "Bottom Aligned" },
        ],
        defaultValue: "center",
      },
      {
        id: "alignment",
        type: "select",
        label: "Text Alignment",
        options: [
          { value: "left", label: "Left Aligned" },
          { value: "center", label: "Center Aligned" },
          { value: "right", label: "Right Aligned" },
        ],
        defaultValue: "center",
      },
    ],
    About: [
      {
        id: "variant",
        type: "select",
        label: "About Section Style",
        options: [
          { value: "split", label: "Standard Split (Bio + Media)" },
          { value: "profile", label: "Actor Profile (Bio + Media + Stats Grid)" },
          { value: "simple", label: "Minimal (Centered Text Only)" },
        ],
        defaultValue: "split",
      },
      {
        id: "layout",
        type: "select",
        label: "Media Position",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
        defaultValue: "right",
      },
      {
        id: "imageFilter",
        type: "select",
        label: "Image Style",
        options: [
          { value: "grayscale", label: "Cinematic Grayscale" },
          { value: "color", label: "Original Color" },
        ],
        defaultValue: "grayscale",
      },
    ],
    Gallery: [
      {
        id: "variant",
        type: "select",
        label: "Gallery Style",
        options: [
          { value: "masonry", label: "Masonry (Pinterest Style)" },
          { value: "carousel", label: "Film Strip (Horizontal Scroll)" },
          { value: "grid", label: "Uniform Grid (Instagram Style)" },
        ],
        defaultValue: "masonry",
      },
      {
        id: "aspectRatio",
        type: "select",
        label: "Crop / Aspect Ratio (Grid Only)",
        options: [
          { value: "square", label: "Square (1:1)" },
          { value: "portrait", label: "Portrait (4:5)" },
          { value: "landscape", label: "Landscape (16:9)" },
        ],
        defaultValue: "square",
        showIf: (settings: any) => (settings.variant || "masonry") === "grid",
      },
      {
        id: "gridColumns",
        type: "select",
        label: "Columns (Desktop Grid)",
        options: [
          { value: "2", label: "2 Columns" },
          { value: "3", label: "3 Columns" },
          { value: "4", label: "4 Columns" },
        ],
        defaultValue: "3",
        showIf: (settings: any) => (settings.variant || "masonry") === "grid",
      },
    ],
    Contact: [
      {
        id: "variant",
        type: "select",
        label: "Contact Style",
        options: [
          { value: "minimal", label: "Minimal (Center Text)" },
          { value: "split", label: "Split (Image + Info)" },
          { value: "card", label: "Floating Card (Premium)" },
        ],
        defaultValue: "minimal",
      },
    ],
    Team: [
      {
        id: "variant",
        type: "select",
        label: "Team Display Style",
        options: [
          { value: "grid", label: "Classic Grid (Equal)" },
          { value: "spotlight", label: "Founder Spotlight (First Large)" },
          { value: "carousel", label: "Horizontal Scroll (Compact)" },
        ],
        defaultValue: "grid",
      },
    ],
    Map: [
      {
        id: "variant",
        type: "select",
        label: "Map Style",
        options: [
          { value: "standard", label: "Standard (Full Width)" },
          { value: "dark", label: "Cinematic (Dark Mode)" },
          { value: "card", label: "Overlay Card (Boxed)" },
        ],
        defaultValue: "standard",
      },
      {
        id: "height",
        type: "select",
        label: "Container Height",
        options: [
          { value: "small", label: "Small (300px)" },
          { value: "medium", label: "Medium (50vh)" },
          { value: "large", label: "Large (70vh - Immersive)" },
        ],
        defaultValue: "medium",
      },
    ],
    Pricing: [
      {
        id: "variant",
        type: "select",
        label: "Display Style",
        options: [
          { value: "cards", label: "Grid Cards (Standard SaaS)" },
          { value: "slider", label: "Carousel (Horizontal Scroll)" },
          { value: "list", label: "Rate Card (Minimal List)" },
        ],
        defaultValue: "cards",
      },
    ],
    Shop: [
      {
        id: "variant",
        type: "select",
        label: "Display Style",
        options: [
          { value: "grid", label: "Grid (Standard)" },
          { value: "carousel", label: "Carousel (Horizontal)" },
          { value: "spotlight", label: "Spotlight (Hero Product)" },
        ],
        defaultValue: "grid",
      },
    ],
    LeadForm: [
      {
        id: "variant",
        type: "select",
        label: "Layout Architecture",
        options: [
          { value: "centered", label: "Centered Box (Standard)" },
          { value: "split", label: "Split Screen (Image + Form)" },
          { value: "minimal", label: "Minimal (Clean / No Box)" },
        ],
        defaultValue: "centered",
      },
    ],
    ImageSlider: [
      {
        id: "variant",
        type: "select",
        label: "Slider Style",
        options: [
          { value: "standard", label: "Standard Swipe" },
          { value: "cinematic", label: "Cinematic Fade (Ken Burns)" },
          { value: "cards", label: "Focus Cards (Center Mode)" },
          { value: "split", label: "Editorial Split Screen" },
          { value: "carousel", label: "Film Strip (Horizontal Scroll)" },
        ],
        defaultValue: "standard",
      },
      {
        id: "height",
        type: "select",
        label: "Slider Height",
        options: [
          { value: "small", label: "Small (350px)" },
          { value: "medium", label: "Medium (500px)" },
          { value: "large", label: "Large (700px)" },
          { value: "full", label: "Full Screen" },
        ],
        defaultValue: "large",
      },
      {
        id: "imageFit",
        type: "select",
        label: "Image Fit",
        options: [
          { value: "cover", label: "Cover (Fill Area)" },
          { value: "contain", label: "Contain (Show Whole Image)" },
        ],
        defaultValue: "cover",
      },
      {
        id: "interval",
        type: "slider",
        label: "Autoplay Speed (Seconds, 0 to disable)",
        min: 0,
        max: 10,
        step: 1,
        defaultValue: 5,
      },
    ],
    VideoSlider: [
      {
        id: "variant",
        type: "select",
        label: "Slider Style",
        options: [
          { value: "cinema", label: "Cinema Spotlight (One at a time)" },
          { value: "carousel", label: "Netflix Strip (Horizontal Scroll)" },
          { value: "grid", label: "Video Grid (Thumbnail Wall)" },
        ],
        defaultValue: "cinema",
      },
      {
        id: "height",
        type: "select",
        label: "Player Height (Cinema Only)",
        options: [
          { value: "small", label: "Small (350px)" },
          { value: "medium", label: "Medium (500px)" },
          { value: "large", label: "Large (700px)" },
          { value: "full", label: "Full Screen" },
        ],
        defaultValue: "large",
        showIf: (settings: any) => (settings.variant || "cinema") === "cinema",
      },
      {
        id: "gridColumns",
        type: "select",
        label: "Grid Columns (Desktop)",
        options: [
          { value: "2", label: "2 Columns" },
          { value: "3", label: "3 Columns" },
          { value: "4", label: "4 Columns" },
        ],
        defaultValue: "3",
        showIf: (settings: any) => (settings.variant || "cinema") === "grid",
      },
      {
        id: "videoFit",
        type: "select",
        label: "Video Fit",
        options: [
          { value: "cover", label: "Cover (Fill Area)" },
          { value: "contain", label: "Contain (Show Whole Video)" },
        ],
        defaultValue: "cover",
      },
    ],
    Reviews: [
      {
        id: "variant",
        type: "select",
        label: "Layout Style",
        options: [
          { value: "grid", label: "Grid (Standard)" },
          { value: "carousel", label: "Carousel (Horizontal Scroll)" },
          { value: "masonry", label: "Masonry (Staggered)" },
        ],
        defaultValue: "grid",
      },
    ],
  },
};
