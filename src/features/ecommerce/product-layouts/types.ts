import React from "react";

// Props handed to Theme's ProductLayout.tsx
export interface ProductLayoutProps {
  product: any;
  username: string;
  currentPrice: number;
  quantity: number;
  setQuantity: React.Dispatch<React.SetStateAction<number>>;
  selectedVariants: Record<string, any>;
  setSelectedVariants: React.Dispatch<
    React.SetStateAction<Record<string, any>>
  >;
  activeImgIndex: number;
  setActiveImgIndex: React.Dispatch<React.SetStateAction<number>>;
  step: "details" | "form" | "success";
  setStep: React.Dispatch<React.SetStateAction<"details" | "form" | "success">>;
  clientInfo: { name: string; phone: string; address: string };
  setClientInfo: React.Dispatch<
    React.SetStateAction<{ name: string; phone: string; address: string }>
  >;
  isSubmitting: boolean;
  handleMainAction: () => void;
  handleConfirmOrder: (e?: React.FormEvent) => void;
  formTemplate?: any;
  formValues?: Record<string, string>;
  setFormValues?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isLoadingForm?: boolean;
  themeConfig?: any;
  customer?: any;
  reviewForm?: { rating: number; title: string; content: string };
  setReviewForm?: React.Dispatch<React.SetStateAction<{ rating: number; title: string; content: string }>>;
  isSubmittingReview?: boolean;
  reviewSuccess?: boolean;
  handleReviewSubmit?: (e: React.FormEvent) => Promise<void> | void;
  relatedProducts?: any[];
}
export interface ShopLayoutProps {
  username: string;
  products: any[];
  collections: any[];
  activeCollection: string | null;
  setActiveCollection: React.Dispatch<React.SetStateAction<string | null>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredProducts: any[];
  themeConfig?: any;
}
