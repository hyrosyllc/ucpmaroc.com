import { Text } from "./components/Text";
import { useScrollObserver } from "./hooks/useScrollObserver";
import { useCart } from "./hooks/useCart";
import { useCartDrawer } from "./hooks/useCartDrawer";
import { useCheckout, useThankYou } from "./hooks/useCheckout";
import { useNavigationTree } from "./hooks/useNavigationTree";
import { useDeviceSize } from "./hooks/useDeviceSize";
import { utils } from "./utils";
import { useGallery } from "./hooks/useGallery"; // 🚀 1. Import it here
import { useCarousel } from "./hooks/useCarousel"; // 🚀 Add this
import { useLeadForm } from "./hooks/useLeadForm"; // 🚀 MUST BE HERE
import { usePricingForm } from "./hooks/usePricingForm"; // 🚀 1. Add this
import { useShopOrderForm } from "./hooks/useShopOrderForm";
import { useFaq } from "./hooks/useFaq";
import { useCountUp } from "./hooks/useCountUp";
import { useBookingFlow } from "@/features/booking/useBookingFlow";
import { BookingPayment } from "@/features/booking/BookingPayment";
import { formatPrice } from "@/features/booking/api";
import { useSlider } from "./hooks/useSlider";
import { useVideoGallery } from "./hooks/useVideoGallery";
import { useReviews } from "./hooks/useReviews";
import { useServicesShowcase } from "./hooks/useServicesShowcase";
import { useStoreProducts, useProductCard, useProductSpotlight } from "./hooks/useStoreProducts";
import { useHeaderChrome } from "./hooks/useHeaderChrome";
import { useAccordion } from "./hooks/useAccordion";
import { HtmlSandbox } from "./components/HtmlSandbox";
import { AudioDemoCard, VideoDemoCard, ScriptDemoCard } from "@/components/DemoCards";
export const UCP = {
  Text,
  useScrollObserver,
  useCart,
  useCartDrawer, // cart drawer state: items, coupon, totals, checkout; pricing and routing stay in the platform
  useCheckout, // checkout state plus platform-owned contact/payment slots
  useThankYou, // order confirmation data
  useNavigationTree,
  useDeviceSize, // 🚀 New!
  useGallery, // 🚀 2. Add it to the SDK object
  useCarousel, // 🚀 Export it here
  useLeadForm, // 🚀 MUST BE EXPORTED HERE
  usePricingForm, // 🚀 2. Export it
  useShopOrderForm,
  useFaq,
  useCountUp,
  useBookingFlow, // availability, slots, form, payment hand-off; rules are enforced server-side
  BookingPayment, // platform-owned secure card form for paid bookings
  formatPrice,
  useSlider,
  useVideoGallery,
  useReviews,
  useServicesShowcase,
  useStoreProducts,
  useProductCard,
  useProductSpotlight,
  useHeaderChrome,
  useAccordion,
  HtmlSandbox, // isolated iframe for owner-authored HTML; themes only choose where it sits
  AudioDemoCard,
  VideoDemoCard,
  ScriptDemoCard,
  utils, // 🚀 New!
};
