import { useCallback, useEffect, useRef, useState } from "react";
import type { AsyncState } from "./useAsync";

export function usePolling<T>(load: () => Promise<T>, interval: number) {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, isLoading: true });
  const loadRef = useRef(load);
  const isBusy = useRef(false);
  const isMounted = useRef(true);
  loadRef.current = load;

  const refresh = useCallback(async () => {
    if (isBusy.current) return;
    isBusy.current = true;
    try {
      const data = await loadRef.current();
      if (isMounted.current) setState({ data, error: null, isLoading: false });
    } catch (err) {
      if (isMounted.current) setState({ data: null, error: String(err), isLoading: false });
    } finally {
      isBusy.current = false;
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    void refresh();
    const timer = setInterval(() => {
      if (document.hasFocus()) void refresh();
    }, interval);
    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, [refresh, interval]);

  return { ...state, refresh };
}
