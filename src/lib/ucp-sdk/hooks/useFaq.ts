import { useCallback, useMemo, useState } from "react";

export interface FaqItem {
  question?: string;
  answer?: string;
  category?: string;
}

interface Options {
  allowMultiple?: boolean;
  firstOpen?: boolean;
}

/** Accordion + category filter state for FAQ sections, plus FAQPage structured data. */
export function useFaq(rawItems: FaqItem[] = [], { allowMultiple = false, firstOpen = false }: Options = {}) {
  const items = useMemo(() => rawItems.filter((i) => i?.question && i?.answer), [rawItems]);
  const [open, setOpen] = useState<Set<number>>(() => new Set(firstOpen ? [0] : []));
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[],
    [items]
  );

  const visible = useMemo(
    () =>
      items
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => category === "all" || item.category === category),
    [items, category]
  );

  const toggle = useCallback(
    (index: number) =>
      setOpen((prev) => {
        const next = new Set(allowMultiple ? prev : []);
        if (prev.has(index)) next.delete(index);
        else next.add(index);
        return next;
      }),
    [allowMultiple]
  );

  // Serialised with "<" escaped so it is safe inside a <script> tag.
  const jsonLd = useMemo(
    () =>
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((i) => ({
          "@type": "Question",
          name: i.question,
          acceptedAnswer: { "@type": "Answer", text: i.answer },
        })),
      }).replace(/</g, "\\u003c"),
    [items]
  );

  return {
    items,
    visible,
    categories,
    category,
    setCategory,
    isOpen: (index: number) => open.has(index),
    toggle,
    jsonLd,
  };
}
