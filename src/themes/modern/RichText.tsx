import React from "react";
import { SectionHeading } from "./components/SectionHeading";

// Plain text only: "# " heading, "- " list items, blank line separates paragraphs.
function renderBlocks(text: string) {
  return text.split(/\n{2,}/).map((block, i) => {
    const lines = block.split("\n").filter(Boolean);
    if (lines.length && lines.every((l) => l.startsWith("- "))) {
      return (
        <ul key={i} className="list-disc pl-6 space-y-1">
          {lines.map((l, j) => (
            <li key={j}>{l.slice(2)}</li>
          ))}
        </ul>
      );
    }
    if (block.startsWith("# ")) {
      return (
        <h3 key={i} className="text-2xl font-semibold text-foreground">
          {block.slice(2)}
        </h3>
      );
    }
    return (
      <p key={i} className="whitespace-pre-line">
        {block}
      </p>
    );
  });
}

const RichText: React.FC<any> = ({ data = {}, isPreview }) => {
  if (!data.content && !data.title) {
    return isPreview ? (
      <div className="py-12 text-center text-sm text-muted-foreground">Add content in the section editor.</div>
    ) : null;
  }
  return (
    <section className="py-16 md:py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading title={data.title} subtitle={data.subtitle} align={data.align === "left" ? "left" : "center"} />
        <div className="space-y-5 text-lg leading-relaxed text-muted-foreground">{renderBlocks(data.content || "")}</div>
      </div>
    </section>
  );
};

export default RichText;
