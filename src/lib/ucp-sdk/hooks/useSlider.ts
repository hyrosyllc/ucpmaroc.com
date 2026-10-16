import { useCallback, useEffect, useState } from "react";

interface Options {
  /** Seconds between automatic advances; 0 disables autoplay. */
  intervalSeconds?: number;
  /** Set false in the builder preview so editing is not distracting. */
  autoplay?: boolean;
}

/** Index state for slideshows and galleries, with optional autoplay. */
export function useSlider(count: number, { intervalSeconds = 0, autoplay = true }: Options = {}) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((i) => (count > 0 ? (i + 1) % count : 0)), [count]);
  const prev = useCallback(() => setCurrent((i) => (count > 0 ? (i - 1 + count) % count : 0)), [count]);
  const goTo = useCallback((index: number) => setCurrent(count > 0 ? ((index % count) + count) % count : 0), [count]);

  useEffect(() => {
    if (current >= count) setCurrent(0);
  }, [count, current]);

  useEffect(() => {
    if (!autoplay || intervalSeconds <= 0 || count < 2) return;
    const timer = setInterval(next, intervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [autoplay, intervalSeconds, count, next]);

  return { current, next, prev, goTo, count };
}
