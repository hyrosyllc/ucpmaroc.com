// src/themes/cupertino/index.ts

import { lazy } from "react";
import { PortfolioThemeDefinition } from "../types";
import { ModernTheme } from "../modern"; // Inherits the lazy-loaded Modern components

// 🚀 1. SYNCHRONOUSLY IMPORT SCHEMAS
// We import JUST the lightweight schema arrays so the Editor can read them instantly.
import { schema as HeaderSchema } from "./Header";
import { schema as HeroSchema } from "./Hero";
import { schema as AboutSchema } from "./About";
import { schema as ContactSchema } from "./Contact";
import { schema as GallerySchema } from "./Gallery"; // Add this when you build the Cupertino Gallery!
import { schema as TeamSchema } from "./Team"; // Add this when you build the Cupertino Gallery!
import { schema as MapSchema } from "./Map"; // Add this when you build the Cupertino Gallery!
import { schema as PricingSchema } from "./Pricing"; // Add this when you build the Cupertino Gallery!
import { schema as LeadFormSchema } from "./LeadForm"; // Add this when you build the Cupertino Gallery!
import { schema as ShopSchema } from "./Shop"; // Add this when you build the Cupertino Gallery!
import { schema as FaqSchema } from "./Faq";
import { schema as StatsSchema } from "./Stats";
import { schema as BookingSchema } from "./Booking";
import { schema as FeaturesSchema } from "./Features";
import { schema as StepsSchema } from "./Steps";
import { schema as CtaSchema } from "./Cta";
import { schema as RichTextSchema } from "./RichText";
import { schema as LogoCloudSchema } from "./LogoCloud";
import { schema as TestimonialsSchema } from "./Testimonials";
import { schema as ImageSliderSchema } from "./ImageSlider";
import { schema as VideoSliderSchema } from "./VideoSlider";
import { schema as HtmlSchema } from "./Html";
import { schema as ReviewsSchema } from "./Reviews";
import { schema as ServicesShowcaseSchema } from "./ServicesShowcase";
import { schema as DynamicStoreSchema } from "./DynamicStore";

// 🚀 2. LAZY LOAD COMPONENTS
// The heavy React code stays lazy to protect performance.
const Header = lazy(() => import("./Header"));
const Hero = lazy(() => import("./Hero"));
const Gallery = lazy(() => import("./Gallery"));
const About = lazy(() => import("./About"));
const Contact = lazy(() => import("./Contact"));
const Team = lazy(() => import("./Team"));
const Map = lazy(() => import("./Map"));
const Pricing = lazy(() => import("./Pricing"));
const LeadForm = lazy(() => import("./LeadForm"));
const Shop = lazy(() => import("./Shop"));
const Faq = lazy(() => import("./Faq"));
const Stats = lazy(() => import("./Stats"));
const Booking = lazy(() => import("./Booking"));
const Features = lazy(() => import("./Features"));
const Steps = lazy(() => import("./Steps"));
const Cta = lazy(() => import("./Cta"));
const RichText = lazy(() => import("./RichText"));
const LogoCloud = lazy(() => import("./LogoCloud"));
const Testimonials = lazy(() => import("./Testimonials"));
const ImageSlider = lazy(() => import("./ImageSlider"));
const VideoSlider = lazy(() => import("./VideoSlider"));
const Html = lazy(() => import("./Html"));
const Reviews = lazy(() => import("./Reviews"));
const ServicesShowcase = lazy(() => import("./ServicesShowcase"));
const DynamicStore = lazy(() => import("./DynamicStore"));

// Commerce views: presentation only; cart, pricing, stock and payment stay in platform controllers.
const ShopLayout = lazy(() => import("./ShopLayout"));
const ProductLayout = lazy(() => import("./ProductLayout"));
const LoginLayout = lazy(() => import("./LoginLayout"));
const CartDrawer = lazy(() => import("./CartDrawer"));
const CheckoutView = lazy(() => import("./CheckoutView"));
const ThankYouView = lazy(() => import("./ThankYouView"));

// Define the Theme
export const CupertinoTheme: PortfolioThemeDefinition & { schemas?: any } = {
  ...ModernTheme, // 1. Fallback to the highly-optimized Modern components

  // 2. Overwrite with our new Cupertino lazy-loaded versions
  Header,
  Hero,
  Gallery,
  About,
  Contact,
  Team,
  Map,
  Pricing,
  LeadForm,
  Shop,
  Faq,
  Stats,
  Booking,
  Features,
  Steps,
  Cta,
  RichText,
  LogoCloud,
  Testimonials,
  ImageSlider,
  VideoSlider,
  Html,
  Reviews,
  ServicesShowcase,
  DynamicStore,
  ShopLayout,
  ProductLayout,
  LoginLayout,
  CartDrawer,
  CheckoutView,
  ThankYouView,

  // 🚀 3. THE FIX: Expose the schemas directly to the Section Editor!
  schemas: {
    Header: HeaderSchema,
    Hero: HeroSchema,
    Gallery: GallerySchema,
    About: AboutSchema,
    Contact: ContactSchema,
    Team: TeamSchema,
    Map: MapSchema,
    Pricing: PricingSchema,
    LeadForm: LeadFormSchema,
    Shop: ShopSchema,
    Faq: FaqSchema,
    Stats: StatsSchema,
    Booking: BookingSchema,
    Features: FeaturesSchema,
    Steps: StepsSchema,
    Cta: CtaSchema,
    RichText: RichTextSchema,
    LogoCloud: LogoCloudSchema,
    Testimonials: TestimonialsSchema,
    ImageSlider: ImageSliderSchema,
    VideoSlider: VideoSliderSchema,
    Html: HtmlSchema,
    Reviews: ReviewsSchema,
    ServicesShowcase: ServicesShowcaseSchema,
    DynamicStore: DynamicStoreSchema,
  },
};
