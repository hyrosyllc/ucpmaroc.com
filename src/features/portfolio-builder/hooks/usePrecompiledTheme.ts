import { useState, useEffect } from 'react';
import * as React from 'react';
import * as LucideReact from 'lucide-react';
import * as FramerMotion from 'framer-motion';
import { cn } from '@/lib/utils';
import { UCP } from '@/lib/ucp-sdk'; // Your SDK

const ALLOWED_MODULES: Record<string, any> = {
  'react': React,
  '@/lib/utils': { cn },
  '@ucp/sdk': { UCP },
  'lucide-react': LucideReact,
  'framer-motion': FramerMotion,
};

const fakeRequire = (moduleName: string) => {
  if (ALLOWED_MODULES[moduleName]) return ALLOWED_MODULES[moduleName];
  if (moduleName === 'lucide-react') {
     return new Proxy(LucideReact, {
         get: (target: any, prop: string) => target[prop] || (() => React.createElement('span', { className: 'text-red-500 text-xs' }, `[${prop}]`))
     });
  }
  return {};
};

export function usePrecompiledTheme(compiledBundle: Record<string, string> | undefined) {
  const [compiledComponents, setCompiledComponents] = useState<Record<string, React.FC<any>>>({});

  useEffect(() => {
    if (!compiledBundle || Object.keys(compiledBundle).length === 0) {
      setCompiledComponents({});
      return;
    }

    try {
      const newComponents: Record<string, React.FC<any>> = {};

      Object.entries(compiledBundle).forEach(([compName, jsCode]) => {
        const exports: any = {};
        const module = { exports };
        
        // 🚀 EXECUTE NATIVELY: Blazing fast, 0 overhead.
        const execute = new Function('exports', 'require', 'module', 'React', jsCode);
        execute(exports, fakeRequire, module, React);

        const Comp = exports.default || module.exports.default || exports;

        if (Comp && typeof Comp === 'function') {
          newComponents[compName] = Comp;
        }
      });

      setCompiledComponents(newComponents);
    } catch (error: any) {
      console.error("Native execution failed:", error);
    }
  }, [compiledBundle]);

  return { compiledComponents };
}