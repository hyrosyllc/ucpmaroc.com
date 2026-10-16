import { useCallback, useState } from "react";

/** Open/closed state for a list of disclosure panels. `single` keeps at most one panel open. */
export function useAccordion({ single = true }: { single?: boolean } = {}) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = useCallback(
    (index: number) =>
      setOpen((prev) => {
        const next = new Set(single ? [] : prev);
        if (prev.has(index)) next.delete(index);
        else next.add(index);
        return next;
      }),
    [single]
  );

  return { isOpen: (index: number) => open.has(index), toggle };
}
