import React from "react";
import { cn } from "@/lib/utils";

// Only relative paths, anchors, and http(s)/mailto/tel links are allowed.
function safeHref(url?: string) {
  if (!url) return undefined;
  return /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim()) ? url.trim() : undefined;
}

const Cta: React.FC<any> = ({ data = {}, settings = {} }) => {
  const align = settings.alignment || data.alignment || "center";
  const primary = safeHref(data.buttonLink);
  const secondary = safeHref(data.secondaryLink);

  if (!data.headline) return null;

  return (
    <section className="py-12 md:py-20 px-6">
      <div
        className={cn(
          "mx-auto max-w-5xl rounded-3xl bg-primary px-8 py-14 text-primary-foreground md:px-16",
          align === "center" ? "text-center" : "text-left"
        )}
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{data.headline}</h2>
        {data.text && <p className="mt-4 max-w-2xl opacity-90 mx-auto whitespace-pre-line">{data.text}</p>}
        {(data.buttonText || data.secondaryText) && (
          <div className={cn("mt-8 flex flex-wrap gap-3", align === "center" && "justify-center")}>
            {data.buttonText && primary && (
              <a href={primary} className="rounded-full bg-background px-6 py-3 font-semibold text-foreground hover:opacity-90">
                {data.buttonText}
              </a>
            )}
            {data.secondaryText && secondary && (
              <a href={secondary} className="rounded-full border border-current px-6 py-3 font-semibold hover:bg-white/10">
                {data.secondaryText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Cta;
