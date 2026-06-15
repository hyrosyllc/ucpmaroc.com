import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  text: string;
  sectionId: string;
  fieldKey: string;
  isPreview?: boolean;
  className?: string;
  // 🚀 FIX 1: Restrict to HTML elements only (No SVGs!)
  tagName?: keyof HTMLElementTagNameMap;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  text,
  sectionId,
  fieldKey,
  isPreview = false,
  className,
  tagName = "span",
}) => {
  const textRef = useRef<HTMLElement>(null);

  const Tag = tagName as any;

  // 🚀 Lock initial text to prevent React from destroying the caret on every keystroke
  const [initialText] = useState(text);

  // When the text prop changes from outside, update the element.
  // But only if it's not currently focused by the user, to prevent cursor jumps.
  useEffect(() => {
    if (textRef.current && text !== textRef.current.innerText && document.activeElement !== textRef.current) {
      textRef.current.innerHTML = text;
    }
  }, [text]);

  if (!isPreview) {
    return <Tag className={className}>{text}</Tag>;
  }

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    if (!textRef.current) return;
    const newText = e.currentTarget.innerText;

    // Post message on every input change for live updates.
    window.parent.postMessage(
      {
        type: "INLINE_EDIT",
        payload: {
          sectionId,
          fieldKey,
          value: newText,
        },
      },
      "*"
    );
  };

  return (
    <Tag
      ref={textRef}
      contentEditable={true}
      suppressContentEditableWarning={true}
      onInput={handleInput}
      onKeyDown={(e: any) => e.stopPropagation()}
      className={cn(className, "hover:outline-dashed hover:outline-1 hover:outline-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:bg-primary/20 caret-primary transition-all cursor-text rounded-sm empty:before:content-['Empty_Text...'] empty:before:text-muted-foreground")}
      dangerouslySetInnerHTML={{ __html: initialText }}
    />
  );
};
