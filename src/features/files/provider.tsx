import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Copy, ExternalLink, FileText, Fingerprint, Folder, FolderOpen } from "lucide-react";
import { CATEGORIES } from "@/core/colors";
import { useLauncher } from "@/core/launcher";
import type { Launcher, LauncherItem, ResultProvider } from "@/core/types";
import { ChecksumView } from "@/features/hash/ChecksumView";

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  extension?: string;
}

const MIN_QUERY_LENGTH = 2;

function useFileSearch(term: string): FileEntry[] {
  const [files, setFiles] = useState<FileEntry[]>([]);

  useEffect(() => {
    if (term.length < MIN_QUERY_LENGTH) {
      setFiles([]);
      return;
    }

    let isStale = false;
    invoke<FileEntry[]>("search_user_files", { query: term })
      .then((found) => {
        if (!isStale) setFiles(found);
      })
      .catch(console.error);

    return () => {
      isStale = true;
    };
  }, [term]);

  return files;
}

function createFileItem(file: FileEntry, launcher: Launcher): LauncherItem {
  return {
    id: `file:${file.path}`,
    section: "Files & Folders",
    icon: file.is_dir
      ? { kind: "tile", icon: Folder, color: CATEGORIES.folder.color }
      : { kind: "tile", icon: FileText, color: CATEGORIES.file.color },
    title: file.name,
    verb: "Open",
    footer: file.path,
    actions: [
      {
        id: "open",
        label: file.is_dir ? "Open Folder" : "Open File",
        icon: ExternalLink,
        run: () => launcher.openPath(file.path),
      },
      {
        id: "show-folder",
        label: "Show in File Explorer",
        icon: FolderOpen,
        hotkey: { key: "Enter", ctrl: true },
        run: () => launcher.showInFolder(file.path),
      },
      {
        id: "copy-path",
        label: "Copy Path",
        icon: Copy,
        run: () => launcher.copyAndClose(file.path),
      },
      ...(file.is_dir
        ? []
        : [
            {
              id: "checksum",
              label: "Show Checksums",
              icon: Fingerprint,
              run: () => launcher.open(<ChecksumView path={file.path} name={file.name} />),
            },
          ]),
    ],
  };
}

export const filesProvider: ResultProvider = {
  id: "files",
  hidesFallback: true,
  useItems: ({ term }) => {
    const launcher = useLauncher();
    const files = useFileSearch(term);
    return useMemo(() => files.map((file) => createFileItem(file, launcher)), [files, launcher]);
  },
};
