import React from "react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "columns", type: "select", label: "Columns", options: ["2", "3", "4"], defaultValue: "3" },
  { id: "cardStyle", type: "select", label: "Card Style", options: ["elevated", "glass", "flat-bordered"], defaultValue: "elevated" },
];

export default function CupertinoFeatures({ data = {}, settings = {}, id, isPreview }: any) {
  const items = (data.items || []).filter((i: any) => i?.title);
  const columns = Number(settings.columns || 3);
  const card =
    settings.cardStyle === "glass" ? "bg-white/50 backdrop-blur-xl border border-white shadow-lg"
    : settings.cardStyle === "flat-bordered" ? "bg-white border border-slate-200"
    : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

  if (items.length === 0) {
    return isPreview ? <div className="py-12 text-center text-sm text-slate-400">Add features in the section editor.</div> : null;
  }

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50">
      <div className="mx-auto max-w-7xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} />
        <ul className={cn("grid gap-5 sm:grid-cols-2", columns === 2 && "lg:grid-cols-2", columns === 3 && "lg:grid-cols-3", columns === 4 && "lg:grid-cols-4")}>
          {items.map((item: any, i: number) => (
            <li key={i} className={cn("rounded-[2rem] p-8 transition-transform duration-500 hover:-translate-y-1 motion-reduce:transition-none", card)}>
              {item.icon && <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl" aria-hidden>{item.icon}</div>}
              <h3 className="text-xl font-[800] tracking-tight text-slate-900">{item.title}</h3>
              {item.description && <p className="mt-2 whitespace-pre-line font-medium leading-relaxed text-slate-500">{item.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
