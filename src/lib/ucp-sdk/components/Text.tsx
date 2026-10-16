import React from "react";
import DOMPurify from "dompurify";
import { InlineEdit } from "@/components/dashboard/InlineEdit";

// Owner text may carry inline formatting, never scripts or event handlers.
const sanitize = (value: unknown) =>
  DOMPurify.sanitize(String(value ?? ""), {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "br", "span", "a", "mark", "small", "sub", "sup"],
    ALLOWED_ATTR: ["href", "target", "rel", "class", "style"],
  });

export function Text({
  field,
  value,
  className,
  as: Tag = "span",
  sectionId,
  isPreview,
}: any) {
  if (sectionId && isPreview) {
    return (
      <InlineEdit
        tagName={Tag}
        text={value}
        sectionId={sectionId}
        fieldKey={field}
        isPreview={isPreview}
        className={className}
      />
    );
  }
  return (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: sanitize(value) }} />
  );
}
