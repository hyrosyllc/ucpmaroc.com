import React from "react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./components/SectionHeading";

const Features: React.FC<any> = ({ data = {}, settings = {}, isPreview }) => {
  const items: any[] = (data.items || []).filter((i: any) => i?.title);
  const columns = Number(settings.columns || data.columns || 3);

  if (items.length === 0) {
    return isPreview ? (
      <div className="py-12 text-center text-sm text-muted-foreground">Add features in the section editor.</div>
    ) : null;
  }

  return (
    <section className="py-16 md:py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={data.title} subtitle={data.subtitle} />
        <ul
          className={cn(
            "grid gap-6 sm:grid-cols-2",
            columns === 2 && "lg:grid-cols-2",
            columns === 3 && "lg:grid-cols-3",
            columns === 4 && "lg:grid-cols-4"
          )}
        >
          {items.map((item, i) => (
            <li key={i} className="rounded-2xl border bg-card p-6">
              {item.icon && <div className="mb-4 text-3xl" aria-hidden>{item.icon}</div>}
              <h3 className="text-lg font-semibold">{item.title}</h3>
              {item.description && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{item.description}</p>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default Features;
