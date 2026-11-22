import { useEffect, useMemo, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

export function useAsync<T>(key: string | null, load: () => Promise<T>, delay = 0): AsyncState<T> {
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    setSettled(null);
    if (key === null) return;

    let isStale = false;
    const timer = setTimeout(() => {
      loadRef
        .current()
        .then((data) => {
          if (!isStale) setSettled({ key, data, error: null });
        })
        .catch((err) => {
          if (!isStale) setSettled({ key, data: null, error: String(err) });
        });
    }, delay);

    return () => {
      isStale = true;
      clearTimeout(timer);
    };
  }, [key, delay]);

  return useMemo(() => {
    if (key === null) return { data: null, error: null, isLoading: false };
    if (settled?.key !== key) return { data: null, error: null, isLoading: true };
    return { data: settled.data, error: settled.error, isLoading: false };
  }, [key, settled]);
}
