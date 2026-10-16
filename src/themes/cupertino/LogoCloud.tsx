import React from "react";
import { cn } from "@/lib/utils";
import { SectionTitle } from "./SectionTitle";

export const schema = [
  { id: "grayscale", type: "toggle", label: "Grayscale logos", defaultValue: true },
];

export default function CupertinoLogoCloud({ data = {}, settings = {}, id, isPreview }: any) {
  const logos = (data.logos || []).filter((l: any) => l?.image);
  const grayscale = settings.grayscale ?? data.grayscale !== false;

  if (logos.length === 0) {
    return isPreview ? <div className="py-12 text-center text-sm text-slate-400">Add logos in the section editor.</div> : null;
  }

  return (
    <section className="py-16 md:py-24 px-6 bg-slate-50">
      <div className="mx-auto max-w-6xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} />
        <ul className="flex flex-wrap items-center justify-center gap-x-14 gap-y-8">
          {logos.map((l: any, i: number) => (
            <li key={i}>
              <img src={l.image} alt={l.name || ""} loading="lazy" className={cn("h-10 w-auto object-contain transition", grayscale && "grayscale opacity-60 hover:grayscale-0 hover:opacity-100")} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
