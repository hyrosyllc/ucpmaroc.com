import React, { useState, useEffect } from 'react';
import * as ReactDOM from 'react-dom'; // 🚀 ADDED THIS
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { UCP } from '@/lib/ucp-sdk'; // Real SDK!
import { DEFAULT_PORTFOLIO_SECTIONS } from '@/features/portfolio-builder/types/portfolio';

// Real UI Components!
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '@/components/ui/select';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Link } from 'react-router-dom';
import * as LucideReact from 'lucide-react';
import * as FramerMotion from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import * as Recharts from 'recharts';
import { format, parseISO } from 'date-fns';
import confetti from 'canvas-confetti';
// Helper to format "Hero.tsx" -> "hero"
function getSectionTypeFromFilename(filename: string): string {
  const name = filename.replace(/\.tsx?$/, '');
  return name.replace(/[A-Z]/g, (letter, index) => 
    index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`
  );
}

export default function StudioPreview() {
  const [searchParams] = useSearchParams();
  const portfolioId = searchParams.get('portfolioId');
  
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [currentComponent, setCurrentComponent] = useState<any>(null);
  const [compiledComponents, setCompiledComponents] = useState<Record<string, any>>({});
  const [isFullPage, setIsFullPage] = useState(false);
  const [currentProps, setCurrentProps] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch real test site data
  useEffect(() => {
    if (!portfolioId) return;
    const fetchSite = async () => {
      const { data } = await supabase.from('portfolios').select('*').eq('id', portfolioId).single();
      setPortfolioData(data);
    };
    fetchSite();
  }, [portfolioId]);

  // 2. The Interceptor (Now with react-dom and standard libraries allowed)
  const fakeRequire = (mod: string) => {
    // 🚀 Core React
    if (mod === 'react') return React;
    if (mod === 'react-dom') return ReactDOM;
    if (mod === 'recharts') return Recharts;
    if (mod === 'date-fns') return { format, parseISO };
    if (mod === 'canvas-confetti') return confetti;
    // 🚀 Platform SDK & Utils
    if (mod === '@ucp/sdk') return { UCP }; 
    if (mod === '@/lib/utils') return { cn };
    
    // 🚀 Allowed Third-Party Libraries
    if (mod === 'framer-motion') return FramerMotion;
    
    // Inject REAL UI Components!
    if (mod === '@/components/ui/button') return { Button };
    if (mod === '@/components/ui/input') return { Input };
    if (mod === '@/components/ui/textarea') return { Textarea };
    if (mod === '@/components/ui/label') return { Label };
    if (mod === '@/components/ui/badge') return { Badge };
    if (mod === '@/components/ui/card') return { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter };
    if (mod === '@/components/ui/select') {
        return {
            Select,
            SelectGroup,
            SelectValue,
            SelectTrigger,
            SelectContent,
            SelectLabel,
            SelectItem,
            SelectSeparator,
            SelectScrollUpButton,
            SelectScrollDownButton,
        };
    }
    if (mod === '@/components/ui/carousel') return { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious };
    if (mod === 'react-router-dom') return { Link };
    
    if (mod === 'lucide-react') {
        return new Proxy(LucideReact, {
            get: (target: any, prop: string) => target[prop] || (() => <span className="text-red-500 text-xs">[{prop}]</span>)
        });
    }

    // Throw a clean error if they try to import something dangerous
    throw new Error(`Security Block: Module "${mod}" is not permitted. Check the SDK Docs for available libraries.`);
  };

  // 3. Listen for Monaco Compiler
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'EXECUTE_CODE') {
        setIsFullPage(false);
        try {
          const exports: any = {};
          const module = { exports };
          const execute = new Function('exports', 'require', 'module', 'React', event.data.code);
          execute(exports, fakeRequire, module, React);

          const Comp = exports.default || module.exports.default || exports;
          setCurrentComponent(() => Comp);

          // Get Real DB Data for this specific component type
          const sectionType = getSectionTypeFromFilename(event.data.activeFile);
          
          const realDbData = portfolioData?.sections?.find((s: any) => s.type === sectionType)?.data;
          const fallbackData = DEFAULT_PORTFOLIO_SECTIONS.find(s => s.type === sectionType)?.data || {};
          const mergedData = { ...(Comp.testData || {}), ...fallbackData, ...realDbData };
          
          setCurrentProps(mergedData);
          setError(null);

          window.parent.postMessage({ 
             type: 'SCHEMA_PARSED', 
             schema: Comp.schema || {},
             testData: mergedData
          }, '*');

        } catch (err: any) {
          setError(err.message);
        }
      }

      if (event.data.type === 'EXECUTE_BUNDLE') {
         setIsFullPage(true);
         try {
             const comps: Record<string, any> = {};
             Object.keys(event.data.bundle).forEach(filename => {
                const exports: any = {};
                const module = { exports };
                const execute = new Function('exports', 'require', 'module', 'React', event.data.bundle[filename]);
                execute(exports, fakeRequire, module, React);
                const Comp = exports.default || module.exports.default || exports;
                if (Comp) comps[filename.replace('.tsx', '')] = Comp;
             });
             setCompiledComponents(comps);
             setError(null);
         } catch (err: any) {
             setError(err.message);
         }
      }

      if (event.data.type === 'UPDATE_PROPS') {
         setCurrentProps((prev: any) => ({ ...prev, ...event.data.props }));
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Tell parent we are mounted and ready to receive code!
    window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    
    return () => window.removeEventListener('message', handleMessage);
  }, [portfolioData]);

  if (error) {
    return <div className="p-6 text-red-500 bg-red-950/20 font-mono text-sm border border-red-500/50 rounded-xl m-4 whitespace-pre-wrap break-words">Compile Error: {error}</div>;
  }

  // 4. Render Engine
  if (isFullPage) {
     return (
       <div className="w-full min-h-screen flex flex-col bg-background text-foreground">
         {Object.entries(compiledComponents).map(([name, Comp]) => {
            const sectionType = getSectionTypeFromFilename(name);
            const realDbData = portfolioData?.sections?.find((s: any) => s.type === sectionType)?.data;
            const fallbackData = DEFAULT_PORTFOLIO_SECTIONS.find(s => s.type === sectionType)?.data || {};
            const mergedData = { ...fallbackData, ...realDbData, ...(Comp.testData || {}) };
            
            return <Comp key={name} data={mergedData} settings={portfolioData?.theme_config || {}} actorId={portfolioData?.actor_id} />;
         })}
       </div>
     );
  }

  if (currentComponent) {
     const Comp = currentComponent;
     return (
        <div className="bg-background text-foreground min-h-screen w-full overflow-hidden">
          <Comp data={currentProps} settings={portfolioData?.theme_config || {}} actorId={portfolioData?.actor_id} isPreview={true} />
        </div>
     );
  }

  return <div className="flex items-center justify-center min-h-screen text-muted-foreground font-mono text-sm"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Waiting for compiler...</div>;
}