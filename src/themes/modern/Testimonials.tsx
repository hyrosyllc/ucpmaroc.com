import React from "react";
import { SectionHeading } from "./components/SectionHeading";

const Testimonials: React.FC<any> = ({ data = {}, isPreview }) => {
  const items: any[] = (data.items || []).filter((i: any) => i?.quote);

  if (items.length === 0) {
    return isPreview ? (
      <div className="py-12 text-center text-sm text-muted-foreground">Add testimonials in the section editor.</div>
    ) : null;
  }

  return (
    <section className="py-16 md:py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={data.title} subtitle={data.subtitle} />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((t, i) => (
            <figure key={i} className="flex flex-col rounded-2xl border bg-card p-6">
              <blockquote className="flex-1 text-muted-foreground whitespace-pre-line">“{t.quote}”</blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {t.avatar && <img src={t.avatar} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />}
                <div>
                  <div className="font-semibold">{t.name}</div>
                  {t.role && <div className="text-xs text-muted-foreground">{t.role}</div>}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
