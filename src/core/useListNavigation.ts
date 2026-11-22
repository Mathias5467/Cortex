import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";

export function useListNavigation(count: number, resetKey: string) {
  const [rawIndex, setIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);
  const index = Math.max(0, Math.min(rawIndex, count - 1));

  useEffect(() => {
    setIndex(0);
  }, [resetKey]);

  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest" });
  }, [index]);

  function handleArrows(event: KeyboardEvent): boolean {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return false;
    event.preventDefault();
    const next = index + (event.key === "ArrowDown" ? 1 : -1);
    setIndex(Math.max(0, Math.min(next, count - 1)));
    return true;
  }

  return { index, setIndex, selectedRef, handleArrows };
}
