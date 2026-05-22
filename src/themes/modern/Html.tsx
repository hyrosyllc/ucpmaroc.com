import React from "react";
import { BlockProps } from "../types";
import DOMPurify from "dompurify";

const Html: React.FC<BlockProps> = ({ data, isPreview }) => {
  const code = data.code || "";
  const allowJs = data.allowJavascript || false;
  const useTailwind = data.useTailwind || false;
  const useFullPage = data.useFullPage || false;

  // 🚀 AAA+ Full-Width Breakout Logic
  // When in Full Page mode, we use a CSS trick to make the iframe break out
  // of any parent containers to truly fill the viewport width.
  const iframeStyle: React.CSSProperties = useFullPage
    ? {
        width: "100vw",
        height: "100vh",
        position: "relative",
        left: "50%",
        transform: "translateX(-50%)",
      }
    : { width: "100%", height: `${data.iframeHeight || 600}px` };

  if (!code && isPreview) {
    return (
      <div className="w-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground text-sm">
        <p className="font-semibold">Custom HTML Block</p>
        <p className="text-xs opacity-70">Paste your code in the sidebar to preview.</p>
      </div>
    );
  }

  if (!code) return null;

  // 🚀 IF JAVASCRIPT IS ENABLED: Render inside a strictly isolated sandbox!
  if (allowJs) {
    // Inject the UCP SDK automatically into the user's sandboxed environment
    const sdkScript = `
      <style>body { margin: 0; overflow-x: hidden; }</style>
      ${useTailwind ? '<script src="https://cdn.tailwindcss.com"></script>' : ''}
      ${useTailwind ? '<script>tailwind.config = { corePlugins: { preflight: false } }</script>' : ''}
      <script>
        // --- BFCACHE RELOAD FIX ---
        // Some browsers (like Safari on iOS) use a back-forward cache that can
        // cause the iframe content to disappear on back navigation. This forces a reload.
        window.addEventListener('pageshow', function(event) {
          if (event.persisted) { window.location.reload(); }
        });
        
        // --- EXTERNAL LINK FIX ---
        // Prevents "api.whatsapp.com is blocked" by forcing external links to open in a new tab 
        // if they don't explicitly have a target and aren't simple anchor links.
        document.addEventListener('click', function(e) {
          const a = e.target.closest('a');
          if (a && a.getAttribute('href')) {
            const href = a.getAttribute('href');
            if (!href.startsWith('#') && !a.target) {
              a.target = '_blank';
              a.rel = 'noopener noreferrer';
            }
          }
        });

        window.UCP = {
          addToCart: function(productId, quantity = 1) {
            window.parent.postMessage({
              type: 'UCP_ADD_TO_CART',
              payload: { productId, quantity }
            }, '*');
          },
          checkout: function(planId) {
            window.parent.postMessage({
              type: 'UCP_CHECKOUT',
              payload: { planId }
            }, '*');
          }
        };
      </script>
    `;
    const injectedCode = `${sdkScript}\n${code}`;
    return (
      <iframe 
        sandbox="allow-scripts allow-popups allow-forms allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox" 
        srcDoc={injectedCode} 
        className="border-0 bg-transparent" 
        style={iframeStyle} 
        title="Custom Sandboxed Block" 
        loading="lazy"
      />
    );
  }

  // --- AAA+ UNIFIED RENDERER ---
  // For the non-JS version, we now ALSO use an iframe. This provides perfect
  // style isolation and fixes a bug where navigating away and back to a page
  // would cause the browser to not re-apply styles, making content disappear.
  // We first sanitize the code to strip all scripts, then inject it.
  const sanitizedCode = DOMPurify.sanitize(code, {
    ADD_TAGS: ["style", "iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "style"],
    USE_PROFILES: { html: true, svg: true, mathMl: true },
  });

  // We safely inject the BFCache reload fix here as well. Because DOMPurify
  // already stripped all user-authored scripts, the only scripts that will run
  // are this cache-buster and the internal scripts of nested iframes (like YouTube).
  const cssOnlyInjectedCode = `
    <style>body { margin: 0; overflow-x: hidden; }</style>
    <script>
      window.addEventListener('pageshow', function(event) { if (event.persisted) window.location.reload(); });
      document.addEventListener('click', function(e) {
        const a = e.target.closest('a');
        if (a && a.getAttribute('href')) {
          const href = a.getAttribute('href');
          if (!href.startsWith('#') && !a.target) {
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
          }
        }
      });
    </script>
    ${sanitizedCode}
  `;

  return (
    <iframe
      sandbox="allow-scripts allow-popups allow-forms allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
      srcDoc={cssOnlyInjectedCode}
      className="border-0 bg-transparent"
      style={iframeStyle}
      title="Custom Sandboxed Block (CSS Only)"
      loading="lazy"
    />
  );
};

export default Html;