import { useEffect, useRef, useState } from "react";

// "50+" -> prefix "", value 50, suffix "+". Non-numeric values are shown as-is.
function parse(raw: string) {
  const m = /^(\D*)([\d.,]+)(.*)$/.exec(String(raw ?? "").trim());
  if (!m) return null;
  const value = Number(m[2].replace(/,/g, ""));
  return Number.isFinite(value) ? { prefix: m[1], value, suffix: m[3] } : null;
}

/** Animates a statistic like "1,200+" from 0 when it scrolls into view. Honors reduced motion. */
export function useCountUp(raw: string, animate = true) {
  const parsed = parse(raw);
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(parsed && animate ? 0 : parsed?.value ?? 0);

  useEffect(() => {
    if (!parsed || !animate) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(parsed.value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / 1200, 1);
        setShown(Math.round(parsed.value * (1 - Math.pow(1 - t, 3))));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [raw, animate]);

  const text = parsed ? `${parsed.prefix}${shown.toLocaleString()}${parsed.suffix}` : String(raw ?? "");
  return { ref, text };
}
