import React from "react";
import { SectionHeading } from "./components/SectionHeading";

const LogoCloud: React.FC<any> = ({ data = {}, isPreview }) => {
  const logos: any[] = (data.logos || []).filter((l: any) => l?.image);

  if (logos.length === 0) {
    return isPreview ? (
      <div className="py-12 text-center text-sm text-muted-foreground">Add logos in the section editor.</div>
    ) : null;
  }

  return (
    <section className="py-12 md:py-16 px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={data.title} subtitle={data.subtitle} />
        <ul className="flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
          {logos.map((l, i) => (
            <li key={i}>
              <img
                src={l.image}
                alt={l.name || ""}
                loading="lazy"
                className={`h-10 w-auto object-contain ${data.grayscale !== false ? "grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition" : ""}`}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default LogoCloud;
