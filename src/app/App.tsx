import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";
import { LauncherContext } from "@/core/launcher";
import { native } from "@/core/native";
import type { Launcher, Notice, PromptRequest } from "@/core/types";
import { useWindowFocus } from "@/core/useWindowFocus";
import { SearchView } from "@/components/launcher/SearchView";
import { Toast } from "@/components/ui/Toast";

const NOTICE_DURATION = 3500;

export default function App() {
  const [views, setViews] = useState<ReactElement[]>([]);
  const [term, setTerm] = useState("");
  const [prompt, setPrompt] = useState<PromptRequest | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const launcher = useMemo<Launcher>(() => {
    function close() {
      setTerm("");
      native.hideWindow().catch(console.error);
    }

    return {
      close,
      copyAndClose: async (text) => {
        await native.copyText(text);
        close();
      },
      copySecretAndClose: async (text) => {
        await native.copySecret(text);
        close();
      },
      openPath: async (path) => {
        await native.launch(path);
        close();
      },
      showInFolder: async (path) => {
        await native.showInFolder(path);
        close();
      },
      open: (next) => {
        setPrompt(null);
        setViews((stack) => [...stack, next]);
      },
      goBack: () => setViews((stack) => stack.slice(0, -1)),
      search: (next) => {
        setViews([]);
        setTerm(next);
      },
      notify: (message, tone = "info") => setNotice({ message, tone }),
      prompt: setPrompt,
    };
  }, []);

  useWindowFocus((focused) => {
    if (!focused) {
      setTerm("");
      setNotice(null);
    }
  });

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION);
    return () => clearTimeout(timer);
  }, [notice]);

  return (
    <LauncherContext value={launcher}>
      <div className="w-full h-screen flex flex-col rounded-xl text-content px-4 py-2 border border-line-strong bg-app backdrop-blur-lg overflow-hidden relative">
        {views.length > 0 ? (
          <Fragment key={views.length}>{views[views.length - 1]}</Fragment>
        ) : (
          <SearchView term={term} onTermChange={setTerm} prompt={prompt} onPromptClose={() => setPrompt(null)} />
        )}
        {notice && <Toast notice={notice} />}
      </div>
    </LauncherContext>
  );
}
