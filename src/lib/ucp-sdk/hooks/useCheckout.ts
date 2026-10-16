import { useContext } from "react";
import { useCheckout as useLiveCheckout } from "@/features/ecommerce/checkout/PublicCheckoutPage";
import { useThankYouModel } from "@/features/ecommerce/checkout/PublicThankYouPage";
import { UcpMockContext } from "../mockContext";

/** Checkout state, shipping, coupon, totals and platform-owned `slots` (contact form, payment). Themes only lay these out. */
export function useCheckout(portfolio: any) {
  const mock = useContext(UcpMockContext);
  // The context never changes during a mount, so the hook order stays stable.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return mock?.checkout ?? useLiveCheckout(portfolio);
}

/** Order confirmation data: the order, digital downloads, display fields and URLs. */
export function useThankYou(portfolio: any) {
  const mock = useContext(UcpMockContext);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return mock?.thankYou ?? useThankYouModel(portfolio);
}
