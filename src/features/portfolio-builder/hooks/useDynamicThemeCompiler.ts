// src/hooks/useDynamicThemeCompiler.ts
import { useState, useEffect } from 'react';
import * as React from 'react';
import * as Babel from '@babel/standalone';
import * as LucideReact from 'lucide-react';
import * as FramerMotion from 'framer-motion';
import { cn } from '@/lib/utils';
import { UCP } from '@/lib/ucp-sdk'; // Make sure this path matches your SDK export

// Map external imports requested by the custom theme to actual loaded modules
const ALLOWED_MODULES: Record<string, any> = {
  'react': React,
  '@/lib/utils': { cn },
  '@ucp/sdk': { UCP },
  'lucide-react': LucideReact,
  'framer-motion': FramerMotion,
};

const fakeRequire = (moduleName: string) => {
  if (ALLOWED_MODULES[moduleName]) {
    return ALLOWED_MODULES[moduleName];
  }
  // Optional: Provide a proxy for Lucide to prevent crashes on missing icons
  if (moduleName === 'lucide-react') {
     return new Proxy(LucideReact, {
         get: (target: any, prop: string) => target[prop] || (() => React.createElement('span', { className: 'text-red-500 text-xs' }, `[${prop}]`))
     });
  }
  console.warn(`[UCP Sandbox] Module "${moduleName}" is not explicitly allowed. Fallback might fail.`);
  return {};
};

export function useDynamicThemeCompiler(themeFiles: Record<string, string> | undefined) {
  const [compiledComponents, setCompiledComponents] = useState<Record<string, React.FC<any>>>({});
  const [compilerError, setCompilerError] = useState<string | null>(null);

  useEffect(() => {
    if (!themeFiles || Object.keys(themeFiles).length === 0) {
      setCompiledComponents({});
      return;
    }

    try {
      const newComponents: Record<string, React.FC<any>> = {};

      Object.entries(themeFiles).forEach(([filename, code]) => {
        if (!filename.endsWith('.tsx') && !filename.endsWith('.jsx')) return;

        // 1. Transpile the raw string from the database
        const result = Babel.transform(code, {
          presets: ["react", "env", "typescript"],
          filename,
        });

        if (result?.code) {
          const exports: any = {};
          const module = { exports };
          
          // 2. Execute the transpiled code
          const execute = new Function('exports', 'require', 'module', 'React', result.code);
          execute(exports, fakeRequire, module, React);

          // 3. Extract the default export (the React Component)
          const Comp = exports.default || module.exports.default || exports;

          if (Comp && typeof Comp === 'function') {
            // Remove the extension to map to section types (e.g., 'Hero.tsx' -> 'Hero')
            const compName = filename.replace(/\.(tsx|jsx|ts|js)$/, '');
            newComponents[compName] = Comp;
          }
        }
      });

      setCompiledComponents(newComponents);
      setCompilerError(null);
    } catch (error: any) {
      console.error("Dynamic compilation failed:", error);
      setCompilerError(error.message);
    }
  }, [themeFiles]);

  return { compiledComponents, compilerError };
}