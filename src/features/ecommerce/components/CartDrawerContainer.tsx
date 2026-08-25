import React, { useEffect } from "react";
import ModernCartDrawer from "@/themes/modern/components/ModernCartDrawer";
import { useCartStore } from "@/features/ecommerce/store/useCartStore";
// import MinimalCartDrawer from '../themes/minimal/CartDrawer';

interface CartDrawerContainerProps {
  theme: string;
  username?: string;
  isPreview?: boolean; // 🚀 1. ADD THIS PROP
  storeId?: string | null;
}

export default function CartDrawerContainer({
  theme,
  username,
  isPreview, // 🚀 2. DESTRUCTURE IT
  storeId,
}: CartDrawerContainerProps) {
  const validateStoreContext = useCartStore((state) => state.validateStoreContext);

  useEffect(() => {
    if (storeId) {
      validateStoreContext(storeId);
    }
  }, [storeId, validateStoreContext]);

  // ROUTER: Inject the exact layout based on the theme

  // if (theme === 'minimal') {
  //   return <MinimalCartDrawer username={username} isPreview={isPreview} />;
  // }

  // Default fallback is ALWAYS Modern
  // 🚀 3. PASS IT DOWN TO THE CART
  return <ModernCartDrawer username={username} isPreview={isPreview} />;
}
