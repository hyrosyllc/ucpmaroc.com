import React from "react";
import { UCP } from "@ucp/sdk";

export function SectionTitle({ data, id, isPreview, fallback }: { data: any; id: string; isPreview?: boolean; fallback?: string }) {
  const title = data.title || fallback;
  if (!title && !data.subtitle) return null;
  return (
    <div className="mb-14 text-center max-w-3xl mx-auto space-y-4">
      {title && (
        <UCP.Text as="h2" field="title" value={title} sectionId={id} isPreview={isPreview} className="text-4xl md:text-6xl font-[800] tracking-tighter text-slate-900" />
      )}
      {data.subtitle && (
        <UCP.Text as="p" field="subtitle" value={data.subtitle} sectionId={id} isPreview={isPreview} className="text-lg md:text-xl text-slate-500 font-medium" />
      )}
    </div>
  );
}
