// Pure module system for custom theme bundles. No React or app imports so it can be tested in Node.

export type ExternalResolver = (specifier: string) => unknown;

export interface LoadedBundle {
  /** Default-exported components, keyed by extension-less file name (e.g. "Hero"). */
  components: Record<string, any>;
  /** Raw `schema` export (or `Component.schema`) per file, before normalisation. */
  schemas: Record<string, unknown>;
  /** Evaluation errors per file; one broken file never blocks the others. */
  errors: Record<string, string>;
}

export const stripExtension = (name: string) => name.replace(/\.(tsx|jsx|ts|js)$/, "");

/** Resolves "./X" or "../y/X" against the importing file's folder inside the bundle. */
export function resolveRelative(fromKey: string, specifier: string): string {
  const parts = fromKey.split("/").slice(0, -1);
  for (const segment of specifier.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  return stripExtension(parts.join("/"));
}

export function loadBundle(bundle: Record<string, string>, external: ExternalResolver, react: unknown): LoadedBundle {
  const sources: Record<string, string> = {};
  for (const [name, code] of Object.entries(bundle)) sources[stripExtension(name)] = code;

  const cache = new Map<string, { exports: any }>();

  const evaluate = (key: string): { exports: any } => {
    const hit = cache.get(key);
    if (hit) return hit;
    const code = sources[key];
    if (code === undefined) throw new Error(`Cannot find module "${key}" in this theme.`);

    const module = { exports: {} as any };
    cache.set(key, module); // registered before running so circular imports see partial exports
    const requireFrom = (specifier: string) => {
      if (specifier.startsWith(".")) return evaluate(resolveRelative(key, specifier)).exports;
      return external(specifier);
    };
    try {
      new Function("exports", "require", "module", "React", code)(module.exports, requireFrom, module, react);
    } catch (error) {
      cache.delete(key);
      throw new Error(`${key}: ${(error as Error).message}`);
    }
    return module;
  };

  const result: LoadedBundle = { components: {}, schemas: {}, errors: {} };
  for (const key of Object.keys(sources)) {
    try {
      const { exports } = evaluate(key);
      const component = exports?.default ?? (typeof exports === "function" ? exports : undefined);
      if (typeof component === "function" || (component && typeof component === "object" && "$$typeof" in component)) {
        result.components[key] = component;
      }
      const schema = exports?.schema ?? component?.schema;
      if (schema !== undefined) result.schemas[key] = schema;
    } catch (error) {
      result.errors[key] = (error as Error).message;
    }
  }
  return result;
}
