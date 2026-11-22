import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { matchesHotkey, type Hotkey } from "@/core/hotkeys";
import { useLauncher } from "@/core/launcher";
import { useListNavigation } from "@/core/useListNavigation";
import { useWindowFocus } from "@/core/useWindowFocus";
import type { LauncherAction, LauncherItem } from "@/core/types";
import { KeyHint } from "@/components/ui/Kbd";
import { View, ViewFooter } from "@/components/ui/View";
import { ActionMenu } from "./ActionMenu";
import { ResultList } from "./ResultList";

const MENU_HOTKEY: Hotkey = { key: "k", ctrl: true };

interface MenuState {
  parentId: string | null;
  index: number;
}

interface ItemBrowserProps {
  items: LauncherItem[];
  resetKey: string;
  emptyLabel: string;
  idleLabel: string;
  escapeLabel: string;
  onEscape: () => void;
  onKey?: (e: KeyboardEvent<HTMLInputElement>) => boolean;
  renderHeader: (onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void) => ReactNode;
}

export function ItemBrowser({
  items,
  resetKey,
  emptyLabel,
  idleLabel,
  escapeLabel,
  onEscape,
  onKey,
  renderHeader,
}: ItemBrowserProps) {
  const launcher = useLauncher();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const { index, setIndex, selectedRef, handleArrows } = useListNavigation(items.length, resetKey);
  const currentItem: LauncherItem | undefined = items[index];

  const parentAction = currentItem?.actions.find((action) => action.id === menu?.parentId);
  const submenu = parentAction && "children" in parentAction ? parentAction : null;
  const menuActions = submenu?.children ?? currentItem?.actions ?? [];
  const menuIndex = menu ? Math.max(0, Math.min(menu.index, menuActions.length - 1)) : 0;

  useWindowFocus((focused) => {
    if (!focused) setMenu(null);
  });

  function openMenu(parentId: string | null) {
    setMenu({ parentId, index: 0 });
  }

  async function executeAction(action: LauncherAction) {
    if ("children" in action) {
      openMenu(action.id);
      return;
    }
    setMenu(null);
    try {
      await action.run();
    } catch (err) {
      console.error(err);
      launcher.notify(String(err), "error");
    }
  }

  function handleMenuKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!menu) return;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        if (submenu) openMenu(null);
        else setMenu(null);
        break;
      case "ArrowDown":
        e.preventDefault();
        setMenu({ ...menu, index: Math.min(menuIndex + 1, menuActions.length - 1) });
        break;
      case "ArrowUp":
        e.preventDefault();
        setMenu({ ...menu, index: Math.max(0, menuIndex - 1) });
        break;
      case "Enter":
        e.preventDefault();
        if (menuActions[menuIndex]) void executeAction(menuActions[menuIndex]);
        break;
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (matchesHotkey(e, MENU_HOTKEY)) {
      e.preventDefault();
      if (menu) setMenu(null);
      else if (currentItem) openMenu(null);
      return;
    }

    if (menu) {
      handleMenuKeyDown(e);
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
      return;
    }

    if (handleArrows(e) || onKey?.(e) || !currentItem) return;

    const action = currentItem.actions.find(({ hotkey }) => hotkey && matchesHotkey(e, hotkey));
    if (action || e.key === "Enter") {
      e.preventDefault();
      void executeAction(action ?? currentItem.actions[0]);
    }
  }

  return (
    <View>
      {renderHeader(handleKeyDown)}

      <ResultList
        items={items}
        emptyLabel={emptyLabel}
        selectedIndex={index}
        selectedRef={selectedRef}
        onSelectIndex={(next) => {
          if (!menu) setIndex(next);
        }}
        onExecute={(item) => void executeAction(item.actions[0])}
      />

      {menu && currentItem && (
        <ActionMenu
          title={submenu?.label ?? "Actions"}
          actions={menuActions}
          selectedIndex={menuIndex}
          onSelectIndex={(next) => setMenu({ ...menu, index: next })}
          onExecute={(action) => void executeAction(action)}
          onBack={submenu ? () => openMenu(null) : undefined}
        />
      )}

      <ViewFooter label={currentItem?.footer ?? idleLabel}>
        <KeyHint keys={["↵"]} label={currentItem?.verb ?? "Open"} />
        <KeyHint keys={["Ctrl", "K"]} label="Actions" />
        <KeyHint keys={["esc"]} label={escapeLabel} />
      </ViewFooter>
    </View>
  );
}
