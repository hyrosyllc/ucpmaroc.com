import React from "react";
import { SectionTitle } from "./SectionTitle";

export const schema: any[] = [];

export default function CupertinoSteps({ data = {}, id, isPreview }: any) {
  const items = (data.items || []).filter((i: any) => i?.title);

  if (items.length === 0) {
    return isPreview ? <div className="py-12 text-center text-sm text-slate-400">Add steps in the section editor.</div> : null;
  }

  return (
    <section className="py-24 md:py-32 px-6 bg-slate-50">
      <div className="mx-auto max-w-4xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} />
        <ol className="space-y-5">
          {items.map((item: any, i: number) => (
            <li key={i} className="flex gap-6 rounded-[2rem] bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-900 text-lg font-[800] text-white" aria-hidden>{i + 1}</span>
              <div>
                <h3 className="text-xl font-[800] tracking-tight text-slate-900">{item.title}</h3>
                {item.description && <p className="mt-1 whitespace-pre-line font-medium text-slate-500">{item.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
