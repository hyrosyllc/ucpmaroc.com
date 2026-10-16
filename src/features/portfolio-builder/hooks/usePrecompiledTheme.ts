import { useMemo } from "react";
import { loadThemeBundle, type CompiledTheme } from "@/lib/theme-runtime";

/** Evaluates a compiled bundle with the shared module allowlist. Kept for API compatibility. */
export function usePrecompiledTheme(compiledBundle: Record<string, string> | undefined) {
  const compiled: CompiledTheme | null = useMemo(
    () => (compiledBundle && Object.keys(compiledBundle).length > 0 ? loadThemeBundle(compiledBundle) : null),
    [compiledBundle]
  );
  return { compiledComponents: compiled?.components ?? {}, errors: compiled?.errors ?? {} };
}
