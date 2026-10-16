import type { CSSProperties } from "react";
import DOMPurify from "dompurify";

const LINK_FIX = `
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (a && a.getAttribute('href')) {
      var href = a.getAttribute('href');
      if (!href.startsWith('#') && !a.target) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    }
  });
  window.addEventListener('pageshow', function(event) { if (event.persisted) window.location.reload(); });
`;

const SDK_BRIDGE = `
  window.UCP = {
    addToCart: function(productId, quantity) {
      window.parent.postMessage({ type: 'UCP_ADD_TO_CART', payload: { productId: productId, quantity: quantity || 1 } }, '*');
    },
    checkout: function(planId) {
      window.parent.postMessage({ type: 'UCP_CHECKOUT', payload: { planId: planId } }, '*');
    }
  };
`;

interface Props {
  code?: string;
  allowJavascript?: boolean;
  useTailwind?: boolean;
  useFullPage?: boolean;
  iframeHeight?: number;
}

const SANDBOX = "allow-scripts allow-popups allow-forms allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox";

/** Renders owner-authored HTML in an isolated iframe. Without JavaScript, scripts are stripped first. */
export function HtmlSandbox({ code = "", allowJavascript, useTailwind, useFullPage, iframeHeight }: Props) {
  if (!code) return null;

  const style: CSSProperties = useFullPage
    ? { width: "100vw", height: "100vh", position: "relative", left: "50%", transform: "translateX(-50%)" }
    : { width: "100%", height: `${iframeHeight || 600}px` };

  const head = `<style>body { margin: 0; overflow-x: hidden; }</style>`;
  const doc = allowJavascript
    ? `${head}
       ${useTailwind ? '<script src="https://cdn.tailwindcss.com"></script><script>tailwind.config = { corePlugins: { preflight: false } }</script>' : ""}
       <script>${LINK_FIX}${SDK_BRIDGE}</script>
       ${code}`
    : `${head}<script>${LINK_FIX}</script>${DOMPurify.sanitize(code, {
        ADD_TAGS: ["style", "iframe"],
        ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "scrolling", "style"],
        USE_PROFILES: { html: true, svg: true, mathMl: true },
      })}`;

  return (
    <iframe
      sandbox={SANDBOX}
      srcDoc={doc}
      className="border-0 bg-transparent"
      style={style}
      title={allowJavascript ? "Custom Sandboxed Block" : "Custom Sandboxed Block (CSS Only)"}
      loading="lazy"
    />
  );
}
