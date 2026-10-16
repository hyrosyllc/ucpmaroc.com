import React from "react";

export const SectionHeading: React.FC<{ title?: string; subtitle?: string; align?: "center" | "left" }> = ({
  title,
  subtitle,
  align = "center",
}) => {
  if (!title && !subtitle) return null;
  return (
    <header className={align === "center" ? "mb-12 text-center" : "mb-12"}>
      {title && <h2 className="text-3xl md:text-4xl font-bold tracking-tight">{title}</h2>}
      {subtitle && <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
    </header>
  );
};
