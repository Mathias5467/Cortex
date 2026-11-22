import { invoke } from "@tauri-apps/api/core";
import { Pipette } from "lucide-react";
import { native } from "@/core/native";
import type { Command } from "@/core/types";

interface EyeDropperApi {
  open: () => Promise<{ sRGBHex: string }>;
}

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperApi;
  }
}

async function pickColor(): Promise<string | null> {
  if (!window.EyeDropper) return invoke<string>("pick_screen_color");
  try {
    const result = await new window.EyeDropper().open();
    return result.sRGBHex;
  } catch {
    return null;
  }
}

export const colorPickerCommands: Command[] = [
  {
    id: "pick-color",
    name: "Color Picker",
    description: "Sample pixel color under mouse cursor",
    icon: Pipette,
    category: "tools",
    run: async (launcher) => {
      const hex = await pickColor();
      if (hex) await native.copyText(hex);
      launcher.close();
    },
  },
];
