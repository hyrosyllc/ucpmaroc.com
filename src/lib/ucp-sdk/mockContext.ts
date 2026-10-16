import { createContext } from "react";

/** Studio previews provide sample hook results here so views render without a live store. Never set on real sites. */
export const UcpMockContext = createContext<{ checkout?: any; thankYou?: any } | null>(null);
