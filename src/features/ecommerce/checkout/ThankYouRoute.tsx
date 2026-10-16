import { useOutletContext } from "react-router-dom";
import { CommerceView } from "@/features/ecommerce/components/CommerceView";
import { DefaultThankYouView } from "./PublicThankYouPage";

/** Route element: the theme's ThankYouView when it has one, otherwise the default view. */
export default function ThankYouRoute() {
  const { portfolio } = useOutletContext<{ portfolio: any }>();
  return (
    <CommerceView
      view="ThankYouView"
      themeId={portfolio?.theme_config?.templateId}
      themeVersion={portfolio?.theme_config?.themeVersion}
      fallback={DefaultThankYouView}
      portfolio={portfolio}
    />
  );
}
