import React from "react";
import ModernCartDrawer from "@/themes/modern/components/ModernCartDrawer";
// import MinimalCartDrawer from '../themes/minimal/CartDrawer';

interface CartDrawerContainerProps {
  theme: string;
  username?: string;
  isPreview?: boolean; // 🚀 1. ADD THIS PROP
}

export default function CartDrawerContainer({
  theme,
  username,
  isPreview, // 🚀 2. DESTRUCTURE IT
}: CartDrawerContainerProps) {
  // ROUTER: Inject the exact layout based on the theme

  // if (theme === 'minimal') {
  //   return <MinimalCartDrawer username={username} isPreview={isPreview} />;
  // }

  // Default fallback is ALWAYS Modern
  // 🚀 3. PASS IT DOWN TO THE CART
  return <ModernCartDrawer username={username} isPreview={isPreview} />;
}
