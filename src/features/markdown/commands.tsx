import { Suspense, lazy } from "react";
import { FileCode2 } from "lucide-react";
import type { Command } from "@/core/types";

const MarkdownView = lazy(() => import("./MarkdownView"));

export const markdownCommands: Command[] = [
  {
    id: "markdown-preview",
    name: "Markdown Preview",
    description: "Write markdown on the left, see the output on the right",
    icon: FileCode2,
    category: "text",
    run: (launcher) =>
      launcher.open(
        <Suspense fallback={null}>
          <MarkdownView />
        </Suspense>,
      ),
  },
];
