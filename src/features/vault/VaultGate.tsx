import { useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { KeyRound, Lock, ShieldCheck, type LucideIcon } from "lucide-react";
import { useLauncher } from "@/core/launcher";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/IconTile";
import { TextField } from "@/components/ui/TextField";
import { View, ViewHeader } from "@/components/ui/View";
import { vaultApi } from "./api";

const MIN_PASSWORD_LENGTH = 6;

interface GateLayoutProps {
  headerIcon: LucideIcon;
  headerTitle: string;
  heroIcon: LucideIcon;
  heading: string;
  hint: string;
  error: string;
  submitLabel: string;
  footnote: string;
  onSubmit: () => void;
  children: ReactNode;
}

function GateLayout({
  headerIcon,
  headerTitle,
  heroIcon,
  heading,
  hint,
  error,
  submitLabel,
  footnote,
  onSubmit,
  children,
}: GateLayoutProps) {
  const { goBack } = useLauncher();

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      goBack();
    }
  }

  return (
    <View onKeyDown={handleKeyDown}>
      <ViewHeader onBack={goBack} icon={headerIcon} title={headerTitle} />

      <div className="flex-1 flex flex-col items-center justify-center gap-3 w-full max-w-xs mx-auto text-center">
        <IconTile icon={heroIcon} size="lg" />
        <div>
          <div className="text-sm font-bold text-content">{heading}</div>
          <div className="text-xs text-muted mt-1">{hint}</div>
        </div>

        {children}

        {error && <div className="text-xs text-danger font-medium">{error}</div>}

        <Button size="md" className="w-full" onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>

      <div className="text-[11px] text-muted text-center pb-1">{footnote}</div>
    </View>
  );
}

interface GateProps {
  onUnlocked: () => void;
}

export function VaultSetup({ onUnlocked }: GateProps) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Master heslo musí mať aspoň ${MIN_PASSWORD_LENGTH} znakov.`);
      return;
    }
    if (password !== confirmation) {
      setError("Heslá sa nezhodujú.");
      return;
    }

    try {
      await vaultApi.setup(password);
      onUnlocked();
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <GateLayout
      headerIcon={ShieldCheck}
      headerTitle="Vytvorenie Trezora"
      heroIcon={Lock}
      heading="Nastav si Master Heslo"
      hint="Toto heslo šifruje všetky tvoje dáta cez AES-256. Ak ho zabudneš, heslá nemožno obnoviť!"
      error={error}
      submitLabel="Vytvoriť a zašifrovať trezor"
      footnote="Zero-Knowledge šifrovanie • AES-256-GCM"
      onSubmit={() => void handleSubmit()}
    >
      <TextField
        autoFocus
        type="password"
        placeholder="Zadaj Master Heslo..."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        type="password"
        placeholder="Zopakuj Master Heslo..."
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
      />
    </GateLayout>
  );
}

export function VaultUnlock({ onUnlocked }: GateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");
    try {
      if (await vaultApi.unlock(password)) onUnlocked();
      else setError("Nesprávne Master Heslo!");
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <GateLayout
      headerIcon={Lock}
      headerTitle="Zamknutý Trezor"
      heroIcon={KeyRound}
      heading="Odomkni Cortex Vault"
      hint="Zadaj Master Heslo na dešifrovanie"
      error={error}
      submitLabel="Odomknúť (Enter)"
      footnote="Esc pre návrat do vyhľadávača"
      onSubmit={() => void handleSubmit()}
    >
      <TextField
        autoFocus
        type="password"
        placeholder="Master Heslo..."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
      />
    </GateLayout>
  );
}
