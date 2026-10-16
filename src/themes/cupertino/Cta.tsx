import React from "react";
import { cn } from "@/lib/utils";

export const schema = [
  { id: "alignment", type: "select", label: "Alignment", options: ["center", "left"], defaultValue: "center" },
  { id: "tone", type: "select", label: "Background", options: ["dark", "light", "gradient"], defaultValue: "dark" },
];

// Only relative paths, anchors, and http(s)/mailto/tel links are allowed.
const safeHref = (url?: string) => (url && /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim()) ? url.trim() : undefined);

export default function CupertinoCta({ data = {}, settings = {} }: any) {
  const align = settings.alignment || "center";
  const tone = settings.tone || "dark";
  const primary = safeHref(data.buttonLink);
  const secondary = safeHref(data.secondaryLink);

  if (!data.headline) return null;

  return (
    <section className="py-16 md:py-24 px-6 bg-slate-50">
      <div
        className={cn(
          "mx-auto max-w-6xl rounded-[3rem] px-8 py-16 md:px-20 md:py-24",
          align === "center" ? "text-center" : "text-left",
          tone === "dark" && "bg-slate-900 text-white",
          tone === "light" && "bg-white text-slate-900 shadow-[0_8px_30px_rgb(0,0,0,0.06)]",
          tone === "gradient" && "bg-gradient-to-br from-blue-600 to-purple-600 text-white"
        )}
      >
        <h2 className="text-4xl md:text-6xl font-[800] tracking-tighter">{data.headline}</h2>
        {data.text && <p className={cn("mt-5 max-w-2xl text-lg font-medium opacity-80 whitespace-pre-line", align === "center" && "mx-auto")}>{data.text}</p>}
        <div className={cn("mt-10 flex flex-wrap gap-3", align === "center" && "justify-center")}>
          {data.buttonText && primary && (
            <a href={primary} className={cn("rounded-full px-8 py-4 font-bold transition hover:scale-105 active:scale-95", tone === "light" ? "bg-slate-900 text-white" : "bg-white text-slate-900")}>
              {data.buttonText}
            </a>
          )}
          {data.secondaryText && secondary && (
            <a href={secondary} className="rounded-full border border-current px-8 py-4 font-bold opacity-90 transition hover:opacity-100">
              {data.secondaryText}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
