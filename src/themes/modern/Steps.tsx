import React from "react";
import { SectionHeading } from "./components/SectionHeading";

const Steps: React.FC<any> = ({ data = {}, isPreview }) => {
  const items: any[] = (data.items || []).filter((i: any) => i?.title);

  if (items.length === 0) {
    return isPreview ? (
      <div className="py-12 text-center text-sm text-muted-foreground">Add steps in the section editor.</div>
    ) : null;
  }

  return (
    <section className="py-16 md:py-24 px-6">
      <div className="mx-auto max-w-4xl">
        <SectionHeading title={data.title} subtitle={data.subtitle} />
        <ol className="space-y-8">
          {items.map((item, i) => (
            <li key={i} className="flex gap-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold" aria-hidden>
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold">{item.title}</h3>
                {item.description && <p className="mt-1 text-muted-foreground whitespace-pre-line">{item.description}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default Steps;
