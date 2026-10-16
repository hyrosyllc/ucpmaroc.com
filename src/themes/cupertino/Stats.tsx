import React from "react";
import { cn } from "@/lib/utils";
import { UCP } from "@ucp/sdk";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "cardStyle", type: "select", label: "Card Style", options: ["elevated", "glass", "flat-bordered"], defaultValue: "elevated" },
];

function Stat({ stat, animate, card }: { stat: any; animate: boolean; card: string }) {
  const count = UCP.useCountUp(stat.value ?? "", animate);
  return (
    <div className={cn("rounded-[2rem] p-8 text-center", card)}>
      <div ref={count.ref} className="text-5xl md:text-6xl font-[800] tracking-tighter text-slate-900">{count.text}</div>
      <div className="mt-2 text-sm font-semibold uppercase tracking-widest text-slate-400">{stat.label}</div>
    </div>
  );
}

export default function CupertinoStats({ data = {}, settings = {}, id, isPreview }: any) {
  const stats = (data.customStats || data.stats || []).filter((s: any) => s?.label || s?.value);
  const card =
    settings.cardStyle === "glass" ? "bg-white/50 backdrop-blur-xl border border-white shadow-lg"
    : settings.cardStyle === "flat-bordered" ? "bg-white border border-slate-200"
    : "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]";

  if (stats.length === 0) {
    return isPreview ? <div className="py-12 text-center text-sm text-slate-400">Add statistics in the section editor.</div> : null;
  }

  return (
    <section className="py-20 md:py-28 px-6 bg-slate-50">
      <div className="mx-auto max-w-6xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} />
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {stats.map((s: any, i: number) => <Stat key={i} stat={s} animate={data.animate !== false} card={card} />)}
        </div>
      </div>
    </section>
  );
}
