import React, { useEffect } from "react";
import ModernCartDrawer from "@/themes/modern/components/ModernCartDrawer";
import { useCartStore } from "@/features/ecommerce/store/useCartStore";
import { CommerceView } from "@/features/ecommerce/components/CommerceView";

interface CartDrawerContainerProps {
  theme: string;
  themeVersion?: number | null;
  username?: string;
  isPreview?: boolean;
  storeId?: string | null;
}

export default function CartDrawerContainer({
  theme,
  themeVersion,
  username,
  isPreview,
  storeId,
}: CartDrawerContainerProps) {
  const validateStoreContext = useCartStore((state) => state.validateStoreContext);

  useEffect(() => {
    if (storeId) {
      validateStoreContext(storeId);
    }
  }, [storeId, validateStoreContext]);

  return <CommerceView view="CartDrawer" themeId={theme} themeVersion={themeVersion} fallback={ModernCartDrawer} username={username} isPreview={isPreview} />;
}
