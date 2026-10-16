import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "variant", type: "select", label: "Layout", options: [{ value: "accordion", label: "Accordion" }, { value: "grid", label: "Bento grid" }], defaultValue: "accordion" },
  { id: "cardStyle", type: "select", label: "Card Style", options: ["elevated", "glass", "flat-bordered"], defaultValue: "elevated" },
];

export default function CupertinoFaq({ data = {}, settings = {}, id, isPreview }: any) {
  const faq = UCP.useFaq(data.items, { allowMultiple: data.allowMultiple === true, firstOpen: data.firstOpen === true });
  const variant = settings.variant || data.variant || "accordion";
  const card =
    settings.cardStyle === "glass" ? "bg-white/50 backdrop-blur-xl border border-white shadow-lg"
    : settings.cardStyle === "flat-bordered" ? "bg-white border border-slate-200"
    : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-transparent";

  if (faq.items.length === 0) {
    return isPreview ? <div className="py-16 text-center text-sm text-slate-400">Add questions in the FAQ section editor.</div> : null;
  }

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50 text-slate-900">
      {!isPreview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faq.jsonLd }} />}
      <div className={cn("mx-auto", variant === "grid" ? "max-w-6xl" : "max-w-3xl")}>
        <SectionTitle data={data} id={id} isPreview={isPreview} />

        {faq.categories.length > 1 && (
          <div className="mb-10 flex flex-wrap justify-center gap-2" role="tablist" aria-label="FAQ categories">
            {["all", ...faq.categories].map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={faq.category === c}
                onClick={() => faq.setCategory(c)}
                className={cn("rounded-full px-5 py-2 text-sm font-semibold transition-colors", faq.category === c ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-100")}
              >
                {c === "all" ? "All" : c}
              </button>
            ))}
          </div>
        )}

        <div className={cn(variant === "grid" ? "grid gap-5 md:grid-cols-2" : "space-y-3")}>
          {faq.visible.map(({ item, index }) => {
            const open = variant === "grid" || faq.isOpen(index);
            return (
              <div key={index} className={cn("rounded-[2rem] overflow-hidden", card, variant === "grid" && "p-8")}>
                {variant === "grid" ? (
                  <h3 className="text-xl font-[800] tracking-tight">{item.question}</h3>
                ) : (
                  <h3>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => faq.toggle(index)}
                      className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      {item.question}
                      <ChevronDown className={cn("h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 motion-reduce:transition-none", open && "rotate-180")} aria-hidden />
                    </button>
                  </h3>
                )}
                <div hidden={!open} className={cn("whitespace-pre-line font-medium leading-relaxed text-slate-500", variant === "grid" ? "mt-3" : "px-7 pb-6")}>
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
