import { useEffect } from "react";
import { LogicalSize, getCurrentWindow, type PhysicalSize } from "@tauri-apps/api/window";

let baseSize: PhysicalSize | null = null;
let pending: Promise<void> = Promise.resolve();

function enqueue(task: () => Promise<void>) {
  pending = pending.then(task).catch(console.error);
}

async function expand(width: number, height: number) {
  const appWindow = getCurrentWindow();
  baseSize ??= await appWindow.innerSize();
  await appWindow.setSize(new LogicalSize(width, height));
  await appWindow.center();
}

async function restore() {
  if (!baseSize) return;
  const appWindow = getCurrentWindow();
  await appWindow.setSize(baseSize);
  await appWindow.center();
}

export function useWindowSize(width: number, height: number) {
  useEffect(() => {
    enqueue(() => expand(width, height));
    return () => enqueue(restore);
  }, [width, height]);
}
