import React from "react";
import { SectionTitle } from "./SectionTitle";

export const schema: any[] = [];

// Plain text only: "# " heading, "- " list items, blank line separates paragraphs.
function blocks(text: string) {
  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length && lines.every((l) => l.startsWith("- "))) {
      return <ul key={i} className="list-disc space-y-1 pl-6">{lines.map((l, j) => <li key={j}>{l.slice(2)}</li>)}</ul>;
    }
    if (block.startsWith("# ")) return <h3 key={i} className="text-3xl font-[800] tracking-tight text-slate-900">{block.slice(2)}</h3>;
    return <p key={i} className="whitespace-pre-line">{block}</p>;
  });
}

export default function CupertinoRichText({ data = {}, id, isPreview }: any) {
  if (!data.content && !data.title) {
    return isPreview ? <div className="py-12 text-center text-sm text-slate-400">Add content in the section editor.</div> : null;
  }
  return (
    <section className="py-20 md:py-28 px-6 bg-slate-50">
      <div className="mx-auto max-w-3xl">
        <SectionTitle data={data} id={id} isPreview={isPreview} />
        <div className="space-y-6 text-xl font-medium leading-relaxed text-slate-500">{blocks(data.content || "")}</div>
      </div>
    </section>
  );
}
