// src/lib/ucp-sdk/types.d.ts

declare module '@ucp/sdk' {
  import * as React from 'react';

  /**
   * The Universal Creator Platform (UCP) SDK.
   * Provides components and hooks to build dynamic, customizable marketplace themes.
   */
  export const UCP: {
    /** * A rich text element that allows end-users to edit content inline on the canvas. 
     * @example
     * <UCP.Text field="headline" default="Welcome!" className="text-2xl font-bold" />
     */
    Text: React.FC<{ 
      /** The unique key in your schema that this text binds to. */
      field: string; 
      /** The rendered text value. */
      value?: string; 
      /** The fallback text to display if the user hasn't typed anything yet. */
      default?: string; 
      /** The ID of the section used for inline editing state. */
      sectionId?: string; 
      /** Whether this text is rendering inside the preview canvas. */
      isPreview?: boolean; 
      /** Tailwind classes for styling. */
      className?: string; 
      /** The HTML tag to render (e.g., 'h1', 'p', 'span'). Defaults to 'span'. */
      as?: any; 
    }>;

    utils: {
      extractIframeSrc: (iframeString: string | undefined) => string;
      getGoogleMapsLink: (address: string, overrideUrl?: string) => string;
      getYoutubeId: (url: string | null | undefined) => string | null;
      isVideo: (url?: string | null) => boolean;
      cleanPhoneNumber: (num?: string | null) => string;
    };

    useScrollObserver: (threshold?: number) => { 
      isScrolled: boolean 
    };

    useCart: () => { 
      cartCount: number; 
      openCart: () => void 
    };

    /**
     * State for a CartDrawer commerce view (file CartDrawer.tsx). Render only when `isOpen`.
     * Pricing, coupons and the checkout route are handled by the platform.
     */
    useCartDrawer: (options?: { username?: string; isPreview?: boolean }) => {
      items: { id: string; title: string; price: number; quantity: number; image?: string; variant?: string }[];
      isOpen: boolean;
      close: () => void;
      setQuantity: (id: string, quantity: number, variant?: string) => void;
      remove: (id: string, variant?: string) => void;
      coupon: { code: string } | null;
      couponInput: string;
      setCouponInput: (value: string) => void;
      couponError: string;
      isValidatingCoupon: boolean;
      submitCoupon: () => Promise<void>;
      removeCoupon: () => void;
      subtotal: number;
      discount: number;
      total: number;
      checkout: () => void;
    };

    /**
     * Checkout state for a CheckoutView (file CheckoutView.tsx). Pass the `portfolio` prop your view receives.
     * `slots.contact` and `slots.payment` are platform components: place them, never replace them.
     */
    useCheckout: (portfolio: any) => {
      items: { id: string; title: string; price: number; quantity: number; image?: string; variant?: string }[];
      coupon: { code: string } | null;
      discount: number;
      subtotal: number;
      finalTotal: number;
      shippingCost: number;
      requiresShipping: boolean;
      applicableRates: { id: string; name: string; rate_cents: number; type: string }[];
      selectedShippingRate: { id: string } | null;
      setSelectedShippingRate: (rate: any) => void;
      couponInput: string;
      setCouponInput: (value: string) => void;
      couponError: string;
      isValidatingCoupon: boolean;
      handleApplyCoupon: () => void;
      removeCoupon: () => void;
      shopUrl: string;
      homeUrl: string;
      initError: string | null;
      checkoutStep: 1 | 2;
      setCheckoutStep: (step: 1 | 2) => void;
      formValues: Record<string, string>;
      isSummaryExpanded: boolean;
      setIsSummaryExpanded: (open: boolean) => void;
      slots: { contact: React.ReactNode; payment: React.ReactNode };
    };

    /** Order confirmation data for a ThankYouView (file ThankYouView.tsx). */
    useThankYou: (portfolio: any) => {
      loading: boolean;
      order: any | null;
      orderNumber: string | null;
      firstName: string;
      digitalProducts: { id: string; title: string; digital_message?: string; digital_files?: { name: string; url: string }[] }[];
      displayName?: string;
      displayEmail: string;
      displayPhone?: string;
      displayAddress: string | null;
      paymentMethod: string;
      shippingMethod: string | null;
      bank: { name: string; holder: string; iban: string } | null;
      items: any[] | null;
      totalDisplay: string | null;
      homeUrl: string;
      shopUrl: string;
      ordersUrl: string;
      handlePrint: () => void;
    };

    useNavigationTree: (props: {
      data: any;
      allSections?: any[];
      theme?: any;
      isPreview?: boolean;
    }) => {
      menuTree: any[];
      handleNavClick: (item: any) => void;
    };

    useDeviceSize: (ref?: React.RefObject<HTMLElement>) => { 
      isMobile: boolean 
    };

    useGallery: (images?: any[], isPreview?: boolean) => {
      lightboxOpen: boolean;
      currentIndex: number;
      currentImage: any;
      carouselRef: React.RefObject<HTMLDivElement>;
      openLightbox: (index: number) => void;
      closeLightbox: () => void;
      nextImage: (e?: React.MouseEvent) => void;
      prevImage: (e?: React.MouseEvent) => void;
      scrollCarousel: (direction: "left" | "right") => void;
    };

    useCarousel: () => {
      carouselRef: React.RefObject<HTMLDivElement>;
      scrollCarousel: (direction: "left" | "right", scrollRatio?: number) => void;
    };

    useLeadForm: (props: {
      data: any;
      actorId?: string;
      portfolioId?: string;
      isPreview?: boolean;
    }) => {
      fields: any[];
      formState: Record<string, string>;
      setFormState: React.Dispatch<React.SetStateAction<Record<string, string>>>;
      isLoading: boolean;
      isSent: boolean;
      handleSubmit: (e: React.FormEvent) => Promise<void>;
      parseOptions: (optString?: string) => string[];
      resetForm: () => void;
    };

    usePricingForm: (props: {
      actorId?: string;
      portfolioId?: string;
      isPreview?: boolean;
    }) => {
      activePlan: any | null;
      formTemplate: any | null;
      isModalOpen: boolean;
      setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
      isLoadingForm: boolean;
      isSubmitting: boolean;
      isSuccess: boolean;
      formValues: Record<string, string>;
      setFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
      handlePlanAction: (plan: any, e: React.MouseEvent) => Promise<void>;
      handleFormSubmit: (e: React.FormEvent) => Promise<void>;
      parseOptions: (optString?: string) => string[];
    };

    useShopOrderForm: (props: {
      actorId?: string;
      portfolioId?: string;
      isPreview?: boolean;
      initialProduct?: any;
    }) => {
      selectedProduct: any | null;
      setSelectedProduct: React.Dispatch<React.SetStateAction<any | null>>;
      step: "details" | "form" | "success";
      setStep: React.Dispatch<React.SetStateAction<"details" | "form" | "success">>;
      formTemplate: any | null;
      setFormTemplate: React.Dispatch<React.SetStateAction<any | null>>;
      isModalOpen: boolean;
      setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
      isLoadingForm: boolean;
      setIsLoadingForm: React.Dispatch<React.SetStateAction<boolean>>;
      isSubmitting: boolean;
      setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
      isSuccess: boolean;
      setIsSuccess: React.Dispatch<React.SetStateAction<boolean>>;
      formValues: Record<string, string>;
      setFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
      selectedVariants: Record<string, any>;
      setSelectedVariants: React.Dispatch<React.SetStateAction<Record<string, any>>>;
      quantity: number;
      setQuantity: React.Dispatch<React.SetStateAction<number>>;
      expandedModalFaq: number | null;
      setExpandedModalFaq: React.Dispatch<React.SetStateAction<number | null>>;
      parseOptions: (optStringOrArray?: string | any[]) => string[];
      calculateTotalPrice: (basePrice: string, variants: Record<string, any>, qty: number) => string;
      openProductModal: (product: any) => void;
      proceedToCheckout: (product: any) => Promise<void>;
      handleFormSubmit: (e: React.FormEvent) => Promise<void>;
    };

    /** Accordion and category state for FAQ sections, plus FAQPage JSON-LD (render it in a script tag). */
    useFaq: (
      items?: Array<{ question?: string; answer?: string; category?: string }>,
      options?: { allowMultiple?: boolean; firstOpen?: boolean }
    ) => {
      items: Array<{ question?: string; answer?: string; category?: string }>;
      visible: Array<{ item: { question?: string; answer?: string; category?: string }; index: number }>;
      categories: string[];
      category: string;
      setCategory: (category: string) => void;
      isOpen: (index: number) => boolean;
      toggle: (index: number) => void;
      jsonLd: string;
    };

    /** Animates a statistic such as "1,200+" when it scrolls into view. Attach `ref` to the element that shows `text`. */
    useCountUp: (raw: string, animate?: boolean) => {
      ref: React.RefObject<any>;
      text: string;
    };

    /**
     * Booking state machine. Availability, double-booking prevention, payment and notifications are
     * enforced by the platform; the theme only renders the returned state.
     */
    useBookingFlow: (props: {
      portfolioId?: string;
      isPreview?: boolean;
      serviceId?: string | null;
    }) => {
      services: Array<{
        id: string;
        name: string;
        description: string | null;
        duration_min: number;
        price_cents: number;
        currency: string;
        location_type: "in_person" | "online" | "phone";
        payment_mode: "none" | "deposit" | "full";
        deposit_cents: number;
      }> | null;
      service: { id: string; name: string; currency: string; price_cents: number; payment_mode: string } | null;
      selectService: (service: any) => void;
      loadingSlots: boolean;
      monthLabel: string;
      leadingBlanks: number;
      days: Array<{ key: string; day: number; available: boolean }>;
      prevMonth: () => void;
      nextMonth: () => void;
      selectedDay: string | null;
      selectDay: (key: string) => void;
      timesForSelectedDay: Array<{ slot: { start: string; end: string }; label: string }>;
      timeZone: string;
      slot: { start: string; end: string } | null;
      pickSlot: (slot: { start: string; end: string }) => void;
      clearSlot: () => void;
      form: { name: string; email: string; phone: string; notes: string; website: string };
      setForm: (form: { name: string; email: string; phone: string; notes: string; website: string }) => void;
      submit: (e?: React.FormEvent) => Promise<void>;
      submitting: boolean;
      error: string | null;
      payment: any | null;
      paid: boolean;
      markPaid: () => void;
      result: { bookingId: string; status: string; start: string; end: string; manageToken: string; serviceName: string } | null;
      addToCalendar: () => void;
      manageUrl: string | null;
    };

    /** The platform's secure card form for paid bookings. Render it when `useBookingFlow().payment` is set. */
    BookingPayment: React.FC<{
      clientSecret: string;
      connectedAccountId: string;
      amountDueCents: number;
      currency: string;
      holdMinutes: number;
      onPaid: () => void;
    }>;

    /** Formats cents as a currency string; 0 renders as "Free". */
    formatPrice: (cents: number, currency: string) => string;

    /** Index state for slideshows, with optional autoplay (seconds). */
    useSlider: (count: number, options?: { intervalSeconds?: number; autoplay?: boolean }) => {
      current: number;
      next: () => void;
      prev: () => void;
      goTo: (index: number) => void;
      count: number;
    };

    /** Carousel index, lightbox, and YouTube/URL helpers for video sections. */
    useVideoGallery: (videos?: Array<{ url: string; title?: string; caption?: string }>, isPreview?: boolean) => {
      count: number;
      current: number;
      next: () => void;
      prev: () => void;
      goTo: (index: number) => void;
      lightboxOpen: boolean;
      lightboxIndex: number;
      lightboxVideo: { url: string; title?: string; caption?: string } | null;
      openLightbox: (index: number) => void;
      closeLightbox: () => void;
      nextInLightbox: () => void;
      prevInLightbox: () => void;
      isYoutube: (url?: string) => boolean;
      thumbnail: (url?: string) => string | null;
      embedUrl: (url?: string) => string | null;
    };

    /** Published reviews and the visitor submission flow. New submissions wait for owner approval. */
    useReviews: (props: { portfolioId?: string; isPreview?: boolean }) => {
      loading: boolean;
      reviews: any[];
      textReviews: any[];
      videoReviews: any[];
      average: number;
      isFormOpen: boolean;
      openForm: () => void;
      closeForm: () => void;
      step: "select_type" | "form";
      setStep: (step: "select_type" | "form") => void;
      reviewType: "text_media" | "video";
      setReviewType: (type: "text_media" | "video") => void;
      draft: { name: string; rating: number; title: string; content: string; images: string[]; video_url: string };
      setDraft: React.Dispatch<React.SetStateAction<{ name: string; rating: number; title: string; content: string; images: string[]; video_url: string }>>;
      uploadMedia: (e: React.ChangeEvent<HTMLInputElement>, kind: "image" | "video") => Promise<void>;
      uploading: boolean;
      submit: (e: React.FormEvent) => Promise<void>;
      isSubmitting: boolean;
      success: boolean;
      error: string | null;
    };

    /** The actor's enabled services with demos (talent sites). */
    useServicesShowcase: (actorId?: string) => {
      services: Array<{ id: "voice_over" | "scriptwriting" | "video_editing"; title: string; description: string; rate: string; demos: any[] }>;
      loading: boolean;
    };

    /** Products for the data-bound store section. */
    useStoreProducts: (props: { data: any; actorId?: string; portfolioId?: string }) => { products: any[]; loading: boolean };

    /** Product card behaviour. `actionKind` lets the theme pick its own label/icon. */
    useProductCard: (product: any, options: { isPreview?: boolean; portfolioId?: string }) => {
      image?: string;
      price: number;
      onSale: boolean;
      hasVariants: boolean;
      isExternal: boolean;
      actionKind: "link" | "options" | "add";
      open: () => void;
      quickAction: () => void;
    };

    /** Featured-product configurator: gallery, variants, quantity, live price, order action. */
    useProductSpotlight: (product: any, options: { isPreview?: boolean; portfolioId?: string }) => {
      images: string[];
      activeImg: number;
      setActiveImg: (index: number) => void;
      nextImage: () => void;
      prevImage: () => void;
      quantity: number;
      setQuantity: React.Dispatch<React.SetStateAction<number>>;
      selectedVariants: Record<string, any>;
      selectVariant: (name: string, value: any) => void;
      currentPrice: number;
      isOutOfStock: boolean;
      openProductPage: () => void;
      act: () => void;
    };

    /** Header state: mobile menu, folders, hide-on-scroll, announcement rotation. */
    useHeaderChrome: (props: { data: any; settings?: any }) => {
      isMenuOpen: boolean;
      setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
      toggleMenu: () => void;
      expandedFolders: string[];
      toggleFolder: (folderId: string) => void;
      isHidden: boolean;
      announcements: Array<{ id: string; text: string; link?: string }>;
      hasAnnouncement: boolean;
      announcementHeight: number;
      activeAnnIndex: number;
    };

    /** Open/closed state for disclosure panels. */
    useAccordion: (options?: { single?: boolean }) => { isOpen: (index: number) => boolean; toggle: (index: number) => void };

    /** Isolated iframe for owner-authored HTML. Themes only decide where it sits. */
    HtmlSandbox: React.FC<{ code?: string; allowJavascript?: boolean; useTailwind?: boolean; useFullPage?: boolean; iframeHeight?: number }>;

    /** Demo cards for the talent services section. */
    AudioDemoCard: React.FC<{ demo: any }>;
    VideoDemoCard: React.FC<{ demo: any }>;
    ScriptDemoCard: React.FC<{ demo: any }>;
  };
}