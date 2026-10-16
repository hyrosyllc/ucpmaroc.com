import { useOutletContext } from "react-router-dom";
import { CommerceView } from "@/features/ecommerce/components/CommerceView";
import { DefaultCheckoutView } from "./PublicCheckoutPage";

/** Route element: the theme's CheckoutView when it has one, otherwise the default view. */
export default function CheckoutRoute() {
  const { portfolio } = useOutletContext<{ portfolio: any }>();
  return (
    <CommerceView
      view="CheckoutView"
      themeId={portfolio?.theme_config?.templateId}
      themeVersion={portfolio?.theme_config?.themeVersion}
      fallback={DefaultCheckoutView}
      portfolio={portfolio}
    />
  );
}
