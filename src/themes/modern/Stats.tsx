import React, { useEffect, useRef, useState } from "react";
import { SectionHeading } from "./components/SectionHeading";

// "50+" -> { prefix: "", value: 50, suffix: "+" }; non-numeric values render as-is.
function parseValue(raw: string) {
  const m = /^(\D*)([\d.,]+)(.*)$/.exec(String(raw).trim());
  if (!m) return null;
  const value = Number(m[2].replace(/,/g, ""));
  return Number.isFinite(value) ? { prefix: m[1], value, suffix: m[3] } : null;
}

const Counter: React.FC<{ raw: string; animate: boolean }> = ({ raw, animate }) => {
  const parsed = parseValue(raw);
  const ref = useRef<HTMLSpanElement>(null);
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

  if (!parsed) return <span>{raw}</span>;
  return (
    <span ref={ref}>
      {parsed.prefix}
      {shown.toLocaleString()}
      {parsed.suffix}
    </span>
  );
};

const Stats: React.FC<any> = ({ data = {}, isPreview }) => {
  const stats: Array<{ label?: string; value?: string }> = (data.customStats || data.stats || []).filter(
    (s: any) => s?.label || s?.value
  );

  if (stats.length === 0) {
    return isPreview ? (
      <div className="py-12 text-center text-sm text-muted-foreground">Add statistics in the section editor.</div>
    ) : null;
  }

  return (
    <section className="py-16 md:py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={data.title} subtitle={data.subtitle} />
        <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col-reverse text-center">
              <dt className="mt-2 text-sm text-muted-foreground">{s.label}</dt>
              <dd className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
                <Counter raw={s.value ?? ""} animate={data.animate !== false} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};

export default Stats;
