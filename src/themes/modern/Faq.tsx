import React, { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FaqItem {
  question?: string;
  answer?: string;
  category?: string;
}

const Faq: React.FC<any> = ({ data = {}, settings = {}, isPreview }) => {
  const baseId = useId();
  const items: FaqItem[] = (Array.isArray(data.items) ? data.items : []).filter(
    (i: FaqItem) => i?.question && i?.answer
  );
  const variant = settings.variant || data.variant || "accordion";
  const allowMultiple = data.allowMultiple === true;
  const [open, setOpen] = useState<Set<number>>(new Set(data.firstOpen ? [0] : []));
  const [category, setCategory] = useState("all");

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];
  const visible = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => category === "all" || item.category === category);

  const toggle = (index: number) =>
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  if (items.length === 0) {
    return isPreview ? (
      <div className="py-16 text-center text-sm text-muted-foreground">Add questions in the FAQ section editor.</div>
    ) : null;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };

  return (
    <section className="py-16 md:py-24 px-6">
      {!isPreview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <div className={cn("mx-auto", variant === "grid" ? "max-w-6xl" : "max-w-3xl")}>
        {(data.title || data.subtitle) && (
          <header className="mb-10 text-center">
            {data.title && <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{data.title}</h2>}
            {data.subtitle && <p className="mt-3 text-muted-foreground">{data.subtitle}</p>}
          </header>
        )}

        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="FAQ categories">
            {["all", ...categories].map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-sm transition-colors",
                  category === c ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                )}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        )}

        <div className={cn(variant === "grid" ? "grid gap-6 md:grid-cols-2" : "divide-y rounded-xl border")}>
          {visible.map(({ item, index }) => {
            const isOpen = variant === "grid" || open.has(index);
            const panelId = `${baseId}-panel-${index}`;
            const buttonId = `${baseId}-button-${index}`;
            return (
              <div key={index} className={cn(variant === "grid" && "rounded-xl border p-6")}>
                {variant === "grid" ? (
                  <h3 className="text-lg font-semibold">{item.question}</h3>
                ) : (
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggle(index)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left font-medium hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {item.question}
                      <ChevronDown className={cn("h-5 w-5 shrink-0 transition-transform motion-reduce:transition-none", isOpen && "rotate-180")} aria-hidden />
                    </button>
                  </h3>
                )}
                <div
                  id={panelId}
                  role={variant === "grid" ? undefined : "region"}
                  aria-labelledby={variant === "grid" ? undefined : buttonId}
                  hidden={!isOpen}
                  className={cn("whitespace-pre-line text-muted-foreground", variant === "grid" ? "mt-2" : "px-6 pb-5")}
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Faq;
