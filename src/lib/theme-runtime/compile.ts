import * as Babel from "@babel/standalone";
import { componentKeyForType, sectionTypeForFile, stripExtension } from "./index";
import { SECTION_LIST } from "@/features/portfolio-builder/sections/registry";

const SOURCE_FILE = /\.(tsx|ts|jsx|js)$/;

export interface CompileResult {
  /** Transpiled CommonJS per source file, keyed by the original file name. */
  bundle: Record<string, string>;
  /** Syntax or transform errors per file. */
  errors: Record<string, string>;
  /** Non-blocking findings (missing default export, unknown section file names). */
  warnings: string[];
}

/** Transpiles every source file in a theme with the same settings the server uses. */
export function compileThemeFiles(files: Record<string, string>): CompileResult {
  const result: CompileResult = { bundle: {}, errors: {}, warnings: [] };

  for (const [name, source] of Object.entries(files)) {
    if (!SOURCE_FILE.test(name)) continue;
    try {
      const out = Babel.transform(source, { presets: ["react", "env", "typescript"], filename: name });
      if (out?.code) result.bundle[name] = out.code;
    } catch (error) {
      result.errors[name] = (error as Error).message;
    }
  }

  const knownKeys = new Set(SECTION_LIST.map((d) => d.componentKey));
  for (const [name, source] of Object.entries(files)) {
    if (!SOURCE_FILE.test(name)) continue;
    const base = stripExtension(name.split("/").pop() ?? name);
    if (knownKeys.has(base) && !/export\s+default/.test(source)) {
      result.warnings.push(`${name} is a section file but has no default export, so it will not render.`);
    }
  }
  return result;
}

export { componentKeyForType, sectionTypeForFile };
