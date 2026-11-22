import { createContext, useContext } from "react";
import type { Launcher } from "./types";

export const LauncherContext = createContext<Launcher | null>(null);

export function useLauncher(): Launcher {
  const launcher = useContext(LauncherContext);
  if (!launcher) throw new Error("useLauncher must be used inside LauncherContext");
  return launcher;
}
