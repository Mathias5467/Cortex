import { native } from "./native";
import { useAsync } from "./useAsync";

const MAX_LENGTH = 5000;

export function useClipboardText(isEnabled: boolean): string {
  const { data } = useAsync(isEnabled ? "clipboard" : null, native.readText);
  return data ? data.trim().slice(0, MAX_LENGTH) : "";
}
