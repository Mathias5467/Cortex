import type { Command } from "@/core/types";
import { caseConverterCommands } from "@/features/case-converter/commands";
import { clipboardCommands } from "@/features/clipboard/commands";
import { colorPickerCommands } from "@/features/color-picker/commands";
import { dockerCommands } from "@/features/docker/commands";
import { environmentCommands } from "@/features/environment/commands";
import { hashCommands } from "@/features/hash/commands";
import { markdownCommands } from "@/features/markdown/commands";
import { mockDataCommands } from "@/features/mock-data/commands";
import { networkCommands } from "@/features/network/commands";
import { secretsCommands } from "@/features/secrets/commands";
import { spotifyCommands } from "@/features/spotify/commands";
import { systemCommands } from "@/features/system/commands";
import { typingCommands } from "@/features/typing/commands";
import { vaultCommands } from "@/features/vault/commands";
import { windowCommands } from "@/features/windows/commands";
import { workspaceCommands } from "@/features/workspaces/commands";

export const COMMANDS: readonly Command[] = [
  ...systemCommands,
  ...clipboardCommands,
  ...colorPickerCommands,
  ...windowCommands,
  ...typingCommands,
  ...workspaceCommands,
  ...vaultCommands,
  ...markdownCommands,
  ...spotifyCommands,
  ...dockerCommands,
  ...environmentCommands,
  ...networkCommands,
  ...caseConverterCommands,
  ...mockDataCommands,
  ...hashCommands,
  ...secretsCommands,
];
