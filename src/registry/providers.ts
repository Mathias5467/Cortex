import type { ResultProvider } from "@/core/types";
import { appsProvider } from "@/features/apps/provider";
import { calculatorProvider } from "@/features/calculator/provider";
import { caseConverterProvider } from "@/features/case-converter/provider";
import { commandsProvider } from "@/features/commands/provider";
import { devToolsProvider } from "@/features/devtools/provider";
import { filesProvider } from "@/features/files/provider";
import { hashProvider } from "@/features/hash/provider";
import { mockDataProvider } from "@/features/mock-data/provider";
import { networkProvider } from "@/features/network/provider";
import { secretsProvider } from "@/features/secrets/provider";
import { spotifyProvider } from "@/features/spotify/provider";
import { unitsProvider } from "@/features/units/provider";
import { webFallbackProvider, webProvider } from "@/features/web/provider";
import { workspacesProvider } from "@/features/workspaces/provider";

export const PROVIDERS: readonly ResultProvider[] = [
  calculatorProvider,
  unitsProvider,
  workspacesProvider,
  devToolsProvider,
  caseConverterProvider,
  hashProvider,
  secretsProvider,
  mockDataProvider,
  networkProvider,
  spotifyProvider,
  webProvider,
  commandsProvider,
  appsProvider,
  filesProvider,
  webFallbackProvider,
];
