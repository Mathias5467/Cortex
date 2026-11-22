import { useEffect, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function useWindowFocus(onChange: (focused: boolean) => void) {
  const callbackRef = useRef(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  });

  useEffect(() => {
    const unlisten = getCurrentWindow().onFocusChanged(({ payload }) => callbackRef.current(payload));
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);
}
