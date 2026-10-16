import { useMemo } from "react";
import { compileThemeFiles } from "@/lib/theme-runtime/compile";
import { loadThemeBundle } from "@/lib/theme-runtime";

/** Compiles raw theme files in the browser (Studio-style) and evaluates them with the shared runtime. */
export function useDynamicThemeCompiler(themeFiles: Record<string, string> | undefined) {
  return useMemo(() => {
    if (!themeFiles || Object.keys(themeFiles).length === 0) return { compiledComponents: {}, compilerError: null as string | null };
    const { bundle, errors } = compileThemeFiles(themeFiles);
    const loaded = loadThemeBundle(bundle);
    const all = { ...errors, ...loaded.errors };
    const message = Object.entries(all).map(([file, error]) => `${file}: ${error}`).join("\n");
    return { compiledComponents: loaded.components, compilerError: message || null };
  }, [themeFiles]);
}
